using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChitLedger.Infrastructure.Data.TenantMigrations
{
    /// <inheritdoc />
    public partial class CollectionAgentSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedRouteId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AdvanceBalance",
                table: "Tickets",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CompanyUpiId",
                table: "TenantSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyUpiName",
                table: "TenantSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DefaultGracePeriodDays",
                table: "TenantSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultLateFeePercent",
                table: "TenantSettings",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "AgentId",
                table: "Receipts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionSubmissionId",
                table: "Receipts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Receipts",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Receipts",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Receipts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TransactionPhotoUrl",
                table: "Receipts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionRouteId",
                table: "Members",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Members",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Members",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionDurationMinutes",
                table: "Auctions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "SessionStartedAt",
                table: "Auctions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CollectionRoutes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RouteName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollectionRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CollectionRoutes_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CollectionSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AgentId = table.Column<int>(type: "int", nullable: false),
                    SubmissionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCash = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCheque = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VerifiedByUserId = table.Column<int>(type: "int", nullable: true),
                    VerifiedById = table.Column<int>(type: "int", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollectionSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CollectionSubmissions_Users_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CollectionSubmissions_Users_VerifiedById",
                        column: x => x.VerifiedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_AssignedRouteId",
                table: "Users",
                column: "AssignedRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_AgentId",
                table: "Receipts",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_CollectionSubmissionId",
                table: "Receipts",
                column: "CollectionSubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_CollectionRouteId",
                table: "Members",
                column: "CollectionRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionRoutes_BranchId",
                table: "CollectionRoutes",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionSubmissions_AgentId",
                table: "CollectionSubmissions",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_CollectionSubmissions_VerifiedById",
                table: "CollectionSubmissions",
                column: "VerifiedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Members_CollectionRoutes_CollectionRouteId",
                table: "Members",
                column: "CollectionRouteId",
                principalTable: "CollectionRoutes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_CollectionSubmissions_CollectionSubmissionId",
                table: "Receipts",
                column: "CollectionSubmissionId",
                principalTable: "CollectionSubmissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Users_AgentId",
                table: "Receipts",
                column: "AgentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_CollectionRoutes_AssignedRouteId",
                table: "Users",
                column: "AssignedRouteId",
                principalTable: "CollectionRoutes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_CollectionRoutes_CollectionRouteId",
                table: "Members");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_CollectionSubmissions_CollectionSubmissionId",
                table: "Receipts");

            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Users_AgentId",
                table: "Receipts");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_CollectionRoutes_AssignedRouteId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "CollectionRoutes");

            migrationBuilder.DropTable(
                name: "CollectionSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_Users_AssignedRouteId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_AgentId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_CollectionSubmissionId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Members_CollectionRouteId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "AssignedRouteId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AdvanceBalance",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CompanyUpiId",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "CompanyUpiName",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "DefaultGracePeriodDays",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "DefaultLateFeePercent",
                table: "TenantSettings");

            migrationBuilder.DropColumn(
                name: "AgentId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "CollectionSubmissionId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "TransactionPhotoUrl",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "CollectionRouteId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "SessionDurationMinutes",
                table: "Auctions");

            migrationBuilder.DropColumn(
                name: "SessionStartedAt",
                table: "Auctions");
        }
    }
}
