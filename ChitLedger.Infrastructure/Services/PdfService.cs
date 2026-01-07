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

    public byte[] GenerateMinutesForm(Auction auction)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header()
                    .Column(c => 
                    {
                         c.Item().Text("FORM VIII").SemiBold().FontSize(16).AlignCenter();
                         c.Item().Text("(See Section 23)").AlignRight().FontSize(10);
                         c.Item().Text("Minutes of Proceedings of Auction").SemiBold().FontSize(14).Underline().AlignCenter();
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(x =>
                    {
                        x.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(150);
                                columns.RelativeColumn();
                            });
                            
                            table.Cell().Text("1. Name of Chit Group:");
                            table.Cell().Text(auction.ChitGroup?.GroupName ?? "N/A").SemiBold();

                            table.Cell().Text("2. Date of Auction:");
                            table.Cell().Text(auction.AuctionDate.ToString("dd-MMM-yyyy hh:mm tt"));

                            table.Cell().Text("3. Auction Installment No:");
                            table.Cell().Text(auction.InstallmentNumber.ToString());

                            table.Cell().Text("4. Total Tickets:");
                            table.Cell().Text(auction.ChitGroup?.Tickets.Count.ToString() ?? "0");
                            
                            // Winner Details
                            // Note: In real app, we'd fetch the Winner's Name using WinningTicketId -> Member
                            // For now, we assume we have access to it or will display Ticket Number
                            table.Cell().Text("5. Successful Bidder Ticket:");
                            table.Cell().Text(auction.WinningTicketId?.ToString() ?? "None");

                            table.Cell().Text("6. Gross Bid Amount:");
                            table.Cell().Text($"{auction.WinningBidAmount:C}");
                            
                            table.Cell().Text("7. Dividend per Ticket:");
                            table.Cell().Text($"{auction.DividendAmount:C}");
                            
                            table.Cell().Text("8. Net Amount Payable to Winner:");
                            table.Cell().Text($"{auction.NetPayableAmount:C}");
                        });

                        x.Item().PaddingTop(20).Text("We certify that the above particulars are correct and the auction was conducted fairly in the presence of the subscribers.").FontSize(10);
                        
                        x.Item().PaddingTop(40).Row(row => 
                        {
                            row.RelativeItem().Column(c => 
                            {
                                c.Item().Text("Signature of Foreman").SemiBold();
                                c.Item().PaddingTop(30).LineHorizontal(1);
                            });
                            
                            row.ConstantItem(50);
                            
                            row.RelativeItem().Column(c => 
                            {
                                c.Item().Text("Signature of Witnesses").SemiBold();
                                c.Item().PaddingTop(30).LineHorizontal(1);
                                c.Item().PaddingTop(10).LineHorizontal(1);
                            });
                        });
                    });

                page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateDemandNotice(Demand demand, Member member, ChitGroup group)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5); // Smaller notice
                page.Margin(1, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Text("PAYMENT DEMAND NOTICE").SemiBold().FontSize(14).AlignCenter();

                page.Content().Column(c =>
                {
                    c.Item().PaddingTop(10).Text($"Date: {DateTime.Now:dd-MMM-yyyy}");
                    
                    c.Item().PaddingTop(10).Text($"To,");
                    c.Item().Text(member.FullName).SemiBold();
                    c.Item().Text($"Mobile: {member.PhoneNumber}");
                    
                    c.Item().PaddingTop(15).Text($"Dear Subscriber,");
                    c.Item().Text($"This is to inform you that the auction for Installment No. {demand.InstallmentNumber} of Group {group.GroupName} has been conducted.");
                    
                    c.Item().PaddingTop(10).Border(1).Padding(5).Table(table => 
                    {
                        table.ColumnsDefinition(cols => { cols.RelativeColumn(); cols.RelativeColumn(); });
                        
                        table.Cell().Text("Installment Amount:");
                        table.Cell().AlignRight().Text($"{group.ChitValue / group.DurationMonths:C}"); // Approx
                        
                        table.Cell().Text("Less: Dividend:");
                        table.Cell().AlignRight().Text($"{demand.DividendAmount:C}");
                        
                        table.Cell().BorderTop(1).Text("Net Payable Amount:").SemiBold();
                        table.Cell().BorderTop(1).AlignRight().Text($"{demand.NetAmount:C}").SemiBold();
                    });
                    
                    c.Item().PaddingTop(10).Text("Please pay the above amount within 7 days to avoid late fees.");
                    c.Item().PaddingTop(20).Text("Yours faithfully,");
                    c.Item().Text("For Chit Fund Company").Italic();
                });
            });
        });
        
        return document.GeneratePdf();
    }

    public byte[] GenerateAgreementForm(ChitGroup group)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header().Column(c =>
                {
                    c.Item().Text("FORM II").SemiBold().FontSize(16).AlignCenter();
                    c.Item().Text("(See Section 8)").AlignRight().FontSize(10);
                    c.Item().Text("Filing of Chit Agreement").SemiBold().FontSize(14).Underline().AlignCenter();
                });

                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Item().Text($"To the Registrar of Chits,");
                    x.Item().PaddingTop(10).Text("Sir,");
                    x.Item().PaddingTop(5).Text($"1. The Chit Agreement of the Chit Group {group.GroupName} has been registered.");
                    x.Item().PaddingTop(5).Text($"2. A copy of the Chit Agreement is attached herewith.");
                    x.Item().PaddingTop(15).Text("DETAILS OF SUBSCRIBERS").SemiBold().Underline();
                    
                    x.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(40);
                            cols.RelativeColumn();
                            cols.ConstantColumn(100);
                        });
                        
                        table.Header(h =>
                        {
                            h.Cell().Border(1).Padding(2).Text("No").SemiBold();
                            h.Cell().Border(1).Padding(2).Text("Subscriber Name").SemiBold();
                            h.Cell().Border(1).Padding(2).Text("Ticket No").SemiBold();
                        });
                        
                        // Lists tickets. Limiting to 20 for demo to avoid pagination complexity in this snippet
                        int i = 1;
                        foreach (var ticket in group.Tickets.Take(20)) 
                        {
                            table.Cell().Border(1).Padding(2).Text(i++.ToString());
                            table.Cell().Border(1).Padding(2).Text(ticket.Member?.FullName ?? "Unknown");
                            table.Cell().Border(1).Padding(2).Text(ticket.TicketNumber.ToString());
                        }
                    });

                    x.Item().PaddingTop(20).Text("Yours faithfully,");
                    x.Item().PaddingTop(30).Text("Foreman").AlignRight();
                });
                
                page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); });
            });
        });
        return document.GeneratePdf();
    }

    public byte[] GenerateBalanceSheet(List<AccountHead> accounts)
    {
        // Simple Balance Sheet Logic: 
        // Assets = Debit Balance
        // Liabilities = Credit Balance
        // Note: real accounting is more complex, but this proves the statutory reporting capability.
        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header().Text("FORM XI").SemiBold().FontSize(16).AlignCenter();
                
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Item().Text("Balance Sheet").SemiBold().FontSize(14).Underline().AlignCenter();
                    x.Item().Text($"As on {DateTime.Now:dd-MMM-yyyy}").AlignCenter();
                    
                    x.Item().PaddingTop(20).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(); // Liabilities
                            cols.ConstantColumn(100); // Amount
                            cols.RelativeColumn(); // Assets
                            cols.ConstantColumn(100); // Amount
                        });

                        table.Header(h => 
                        {
                            h.Cell().Border(1).Padding(5).Text("Liabilities").SemiBold();
                            h.Cell().Border(1).Padding(5).AlignRight().Text("Amount").SemiBold();
                            h.Cell().Border(1).Padding(5).Text("Assets").SemiBold();
                            h.Cell().Border(1).Padding(5).AlignRight().Text("Amount").SemiBold();
                        });

                        // Very basic split. 
                        // In reality, we would map Account Groups properly.
                        // Here we just assume Credit balance = Liability/Income, Debit = Asset/Expense for display
                        
                        var assets = accounts.Where(a => a.Type == AccountType.Asset).ToList(); // Simplified
                        var liabilities = accounts.Where(a => a.Type == AccountType.Liability || a.Type == AccountType.Income).ToList(); // Simplified

                        int maxRows = Math.Max(assets.Count, liabilities.Count);
                        
                        for(int i=0; i<maxRows; i++)
                        {
                            // Liability Side
                            if(i < liabilities.Count) {
                                table.Cell().Border(1).Padding(2).Text(liabilities[i].AccountName);
                                // Mock balance calculation or use 0 if not passed
                                table.Cell().Border(1).Padding(2).AlignRight().Text("0.00"); 
                            } else {
                                table.Cell().Border(1).Padding(2).Text("");
                                table.Cell().Border(1).Padding(2).Text("");
                            }

                            // Asset Side
                            if(i < assets.Count) {
                                table.Cell().Border(1).Padding(2).Text(assets[i].AccountName);
                                table.Cell().Border(1).Padding(2).AlignRight().Text("0.00");
                            } else {
                                table.Cell().Border(1).Padding(2).Text("");
                                table.Cell().Border(1).Padding(2).Text("");
                            }
                        }
                    });
                });
                
                page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); });

            });
        });
        
        return document.GeneratePdf();
    }
}
