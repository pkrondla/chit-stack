using ChitStack.Application;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Global.API.Services;
using ChitStack.Infrastructure;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices();

var globalConnectionString = builder.Configuration.GetConnectionString("GlobalDBConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:GlobalDBConnection is required.");
builder.Services.AddScoped<INotificationsHubService, NoOpNotificationsHubService>();
builder.Services.AddTransient<GlobalMaintenanceHeartbeatJob>();
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(globalConnectionString));
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 1;
    options.Queues = new[] { "global-default", "global-notifications", "global-maintenance" };
});

builder.Services.AddInfrastructureServices(builder.Configuration);

// Context Accessor
builder.Services.AddHttpContextAccessor();

// Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ChitStack",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ChitStackApp",
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_12345_must_be_long_enough")),
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
});

// CORS — browser origin is the Static Web App host (*.azurestaticapps.net) in Azure; Vite dev servers locally.
builder.Services.AddCors(options =>
{
    var extraOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    options.AddPolicy("AllowClient", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (extraOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)) return true;
                if (origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) ||
                    origin.StartsWith("http://127.0.0.1:", StringComparison.OrdinalIgnoreCase))
                    return true;
                try
                {
                    var uri = new Uri(origin);
                    if (uri.Scheme == "https" && uri.Host.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase))
                        return true;
                }
                catch (UriFormatException)
                {
                    return false;
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowClient");

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/global-admin/hangfire");

app.MapControllers();

RecurringJob.AddOrUpdate<GlobalMaintenanceHeartbeatJob>(
    "global-heartbeat",
    job => job.RunAsync(),
    Cron.Hourly());

app.Run();
