using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitStack.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AddModeSpecificTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailHtmlTemplate",
                table: "NotificationTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SmsTemplate",
                table: "NotificationTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhatsAppTemplate",
                table: "NotificationTemplates",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailHtmlTemplate",
                table: "NotificationTemplates");

            migrationBuilder.DropColumn(
                name: "SmsTemplate",
                table: "NotificationTemplates");

            migrationBuilder.DropColumn(
                name: "WhatsAppTemplate",
                table: "NotificationTemplates");
        }
    }
}
