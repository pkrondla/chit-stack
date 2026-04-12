using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitStack.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AddStaffNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "StaffInPortalAlertsEnabled",
                table: "TenantSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "StaffTelegramAlertsEnabled",
                table: "TenantSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TelegramBotToken",
                table: "TenantSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramChannelId",
                table: "TenantSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Notifications",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "ChannelsSent",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MemberId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TemplateName",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailEnabled",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "InPortalEnabled",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SmsEnabled",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "WhatsAppEnabled",
                table: "Members",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StaffInPortalAlertsEnabled",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "StaffTelegramAlertsEnabled",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "TelegramBotToken",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "TelegramChannelId",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "ChannelsSent",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "MemberId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TemplateName",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "EmailEnabled",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "InPortalEnabled",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "SmsEnabled",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "WhatsAppEnabled",
                table: "Members");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Notifications",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
