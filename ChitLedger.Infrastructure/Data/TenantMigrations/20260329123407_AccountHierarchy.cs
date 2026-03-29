using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitLedger.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AccountHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGroup",
                table: "AccountHeads",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "AccountHeads",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountHeads_ParentId",
                table: "AccountHeads",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_AccountHeads_AccountHeads_ParentId",
                table: "AccountHeads",
                column: "ParentId",
                principalTable: "AccountHeads",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountHeads_AccountHeads_ParentId",
                table: "AccountHeads");

            migrationBuilder.DropIndex(
                name: "IX_AccountHeads_ParentId",
                table: "AccountHeads");

            migrationBuilder.DropColumn(
                name: "IsGroup",
                table: "AccountHeads");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "AccountHeads");
        }
    }
}
