using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lumino.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAchievementConditions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConditionThreshold",
                table: "Achievements",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConditionType",
                table: "Achievements",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConditionThreshold",
                table: "Achievements");

            migrationBuilder.DropColumn(
                name: "ConditionType",
                table: "Achievements");
        }
    }
}
