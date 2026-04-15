using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitStack.Infrastructure.Migrations
{
    public partial class AddLiveRoomTtsTenantSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LiveRoomTtsEnabled",
                table: "TenantSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PreferredAuctionVoiceLanguage",
                table: "TenantSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "en");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LiveRoomTtsEnabled",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "PreferredAuctionVoiceLanguage",
                table: "TenantSettings");
        }
    }
}
