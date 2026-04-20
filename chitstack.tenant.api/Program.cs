using ChitStack.Application;
using ChitStack.Infrastructure;
using ChitStack.Infrastructure.Configuration;
using ChitStack.API.Middleware;
using ChitStack.API.Services;
using Serilog;
using Microsoft.OpenApi.Models;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);
var tenantStampOptions = builder.Configuration.GetSection(TenantStampOptions.SectionName).Get<TenantStampOptions>() ?? new TenantStampOptions();
var tenantDbConnection = string.IsNullOrWhiteSpace(tenantStampOptions.FixedTenantConnectionString)
    ? builder.Configuration.GetConnectionString("TenantDBConnection")
    : tenantStampOptions.FixedTenantConnectionString;
var seedOnStartup = builder.Configuration.GetValue("SeedOnStartup", true);

// Serilog Setup
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddScoped<ChitStack.Infrastructure.Data.Seeding.InitialDataSeeder>();

// Hangfire Configuration
builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(tenantDbConnection));
builder.Services.AddHangfireServer(options =>
{
    options.Queues = new[] { "tenant-default", "tenant-notifications", "tenant-maintenance" };
});

// Context Accessor
builder.Services.AddHttpContextAccessor();

// Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ChitStack",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ChitStackApp",
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_12345_must_be_long_enough")),
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/auctionHub") || path.StartsWithSegments("/notificationHub") || path.StartsWithSegments("/api/forms")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// SignalR
builder.Services.AddSignalR();
builder.Services.AddScoped<ChitStack.Application.Common.Interfaces.IAuctionNotificationService, ChitStack.API.Services.AuctionNotificationService>();
builder.Services.AddScoped<ChitStack.Application.Common.Interfaces.INotificationsHubService, ChitStack.API.Services.NotificationsHubService>();
builder.Services.AddSingleton<TieBreakerOrchestrator>();
builder.Services.Configure<AzureSpeechOptions>(builder.Configuration.GetSection("AzureSpeech"));
builder.Services.AddHttpClient<IAzureSpeechSynthesisService, AzureSpeechSynthesisService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173")
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
app.UseStaticFiles();

app.UseSerilogRequestLogging();

app.UseMiddleware<TenantMiddleware>();
app.UseMiddleware<BranchMiddleware>();

app.UseCors("AllowClient");

app.UseAuthentication();
app.UseAuthorization();

// Hangfire Dashboard
app.UseHangfireDashboard("/admin/hangfire");

app.MapControllers();
app.MapHub<ChitStack.API.Hubs.AuctionHub>("/auctionHub");
app.MapHub<ChitStack.API.Hubs.NotificationHub>("/notificationHub");

using (var scope = app.Services.CreateScope())
{
    if (seedOnStartup)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<ChitStack.Infrastructure.Data.Seeding.InitialDataSeeder>();
        await seeder.SeedAsync();
    }

    // Setup Recurring Jobs
    RecurringJob.AddOrUpdate<ChitStack.Infrastructure.Services.DailyNotificationWorker>("daily-automated-notifications", 
        worker => worker.ProcessAutomatedNotifications(),
        Cron.Daily(9));
}

app.Run();
