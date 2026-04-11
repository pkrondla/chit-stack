using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitStack.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class ResolvePendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Changes related to Multi-Channel Notification System already exist effectively in the target database.
            // This migration syncs the ModelSnapshot with the current schema.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Down migration intentionally empty to match no-op sync.
        }
    }
}
