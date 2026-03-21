using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitLedger.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AddIsLotteryWinner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "GstPercent",
                table: "TenantSettings",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsLotteryWinner",
                table: "AuctionBids",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SystemRole",
                table: "AccountHeads",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GstPercent",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "IsLotteryWinner",
                table: "AuctionBids");

            migrationBuilder.DropColumn(
                name: "SystemRole",
                table: "AccountHeads");
        }
    }
}
