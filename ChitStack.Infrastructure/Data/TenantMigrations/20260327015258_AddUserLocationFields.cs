using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitStack.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class AddUserLocationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "LastLatitude",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLocationUpdateTime",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LastLongitude",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastLatitude",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastLocationUpdateTime",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastLongitude",
                table: "Users");
        }
    }
}
