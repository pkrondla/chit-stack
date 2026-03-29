using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitLedger.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AddJournalLineSubLedgerTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AuctionId",
                table: "JournalEntryLines",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChitGroupId",
                table: "JournalEntryLines",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MemberId",
                table: "JournalEntryLines",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TicketId",
                table: "JournalEntryLines",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_AuctionId",
                table: "JournalEntryLines",
                column: "AuctionId");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_ChitGroupId",
                table: "JournalEntryLines",
                column: "ChitGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_MemberId",
                table: "JournalEntryLines",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_TicketId",
                table: "JournalEntryLines",
                column: "TicketId");

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntryLines_Auctions_AuctionId",
                table: "JournalEntryLines",
                column: "AuctionId",
                principalTable: "Auctions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntryLines_ChitGroups_ChitGroupId",
                table: "JournalEntryLines",
                column: "ChitGroupId",
                principalTable: "ChitGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntryLines_Members_MemberId",
                table: "JournalEntryLines",
                column: "MemberId",
                principalTable: "Members",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntryLines_Tickets_TicketId",
                table: "JournalEntryLines",
                column: "TicketId",
                principalTable: "Tickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntryLines_Auctions_AuctionId",
                table: "JournalEntryLines");

            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntryLines_ChitGroups_ChitGroupId",
                table: "JournalEntryLines");

            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntryLines_Members_MemberId",
                table: "JournalEntryLines");

            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntryLines_Tickets_TicketId",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntryLines_AuctionId",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntryLines_ChitGroupId",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntryLines_MemberId",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntryLines_TicketId",
                table: "JournalEntryLines");

            migrationBuilder.DropColumn(
                name: "AuctionId",
                table: "JournalEntryLines");

            migrationBuilder.DropColumn(
                name: "ChitGroupId",
                table: "JournalEntryLines");

            migrationBuilder.DropColumn(
                name: "MemberId",
                table: "JournalEntryLines");

            migrationBuilder.DropColumn(
                name: "TicketId",
                table: "JournalEntryLines");
        }
    }
}
