using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChitLedger.Infrastructure.Services;

public class PdfService : IPdfService
{
    public byte[] GenerateSanctionForm(ChitGroup group)
    {
        // Simple Form I template
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header()
                    .Text("FORM I")
                    .SemiBold().FontSize(16).AlignCenter();

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(x =>
                    {
                        x.Item().Text("(See Section 4)").AlignRight();
                        x.Item().Text("Application for Sanction").SemiBold().FontSize(14).Underline().AlignCenter();
                        x.Item().PaddingTop(10).Text($"To the Registrar of Chits,");
                        x.Item().PaddingTop(20).Text($"Sir,");
                        x.Item().PaddingTop(10).Text($"We desire to conduct a chit as per the following particulars:");
                        
                        x.Item().PaddingTop(15).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);
                                columns.RelativeColumn();
                            });

                            table.Cell().Row(1).Column(1).Text("1.");
                            table.Cell().Row(1).Column(2).Text($"Name of Chit Group: {group.GroupName}");
                            
                            table.Cell().Row(2).Column(1).Text("2.");
                            table.Cell().Row(2).Column(2).Text($"Chit Value: {group.ChitValue:C}");

                            table.Cell().Row(3).Column(1).Text("3.");
                            table.Cell().Row(3).Column(2).Text($"Duration: {group.DurationMonths} Months");
                            
                            // Add more particulars per Chit Act
                        });
                        
                        x.Item().PaddingTop(30).Text("We therefore request you to give sanction for the commencement of the chit.");
                        x.Item().PaddingTop(50).Text("Yours faithfully,");
                        x.Item().PaddingTop(30).Text("Foreman").AlignRight();
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                    });
            });
        });

        return document.GeneratePdf();
    }
}
