using (var context = new ChitLedger.Infrastructure.Data.TenantDbContext(new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<ChitLedger.Infrastructure.Data.TenantDbContext>().UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=ChitLedger;Trusted_Connection=True;MultipleActiveResultSets=true").Options, null))
{
    var accounts = context.AccountHeads.ToList();
    Console.WriteLine("ID | ParentID | AccountName | IsGroup");
    foreach (var a in accounts.OrderBy(x => x.ParentId).ThenBy(x => x.AccountName))
    {
        Console.WriteLine($"{a.Id} | {a.ParentId} | {a.AccountName} | {a.IsGroup}");
    }
}
