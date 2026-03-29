using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddDbContext<TenantDbContext>(options => 
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=ChitLedgerTenant_default;Trusted_Connection=True;MultipleActiveResultSets=true"));

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<TenantDbContext>();

var accounts = await context.AccountHeads
    .Select(a => new { a.AccountName, a.Type, ParentName = a.Parent != null ? a.Parent.AccountName : "NONE", a.IsGroup })
    .ToListAsync();

Console.WriteLine("Account Mapping Status:");
Console.WriteLine("--------------------------------------------------------------------------------");
foreach (var acc in accounts)
{
    Console.WriteLine($"Name: {acc.AccountName,-30} Type: {acc.Type,-12} Parent: {acc.ParentName,-20} IsGroup: {acc.IsGroup}");
}
Console.WriteLine("--------------------------------------------------------------------------------");
