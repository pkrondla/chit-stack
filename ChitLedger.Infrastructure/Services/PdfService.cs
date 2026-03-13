using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ChitLedger.Infrastructure.Services;

public class PdfService : IPdfService
{
    // =====================================================================
    // SHARED HELPERS
    // =====================================================================

    private static void AddHeader(ColumnDescriptor col, string formNumber, string section, string title, string? subTitle = null)
    {
        col.Item().AlignCenter().Text("FORM " + formNumber).Bold().FontSize(14);
        col.Item().AlignRight().Text($"(See {section})").FontSize(9);
        col.Item().PaddingTop(2).AlignCenter().Text(title).SemiBold().FontSize(12).Underline();
        if (subTitle != null)
            col.Item().AlignCenter().Text(subTitle).FontSize(10).Italic();
    }

    private static void AddSignatureBlock(ColumnDescriptor col, string groupName, string foremansName = "[Foreman Name]")
    {
        col.Item().PaddingTop(15).Text("Yours faithfully,");
        col.Item().PaddingTop(30).Row(row =>
        {
            row.RelativeItem().Column(c =>
            {
                c.Item().LineHorizontal(1);
                c.Item().PaddingTop(3).Text(foremansName).SemiBold();
                c.Item().Text("Foreman").Italic();
                c.Item().Text($"for and on behalf of {groupName}");
            });
        });
    }

    private static void AddPageSetup(PageDescriptor page)
    {
        page.Size(PageSizes.A4);
        page.Margin(2, Unit.Centimetre);
        page.PageColor(Colors.White);
        page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));
        page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); x.Span(" of "); x.TotalPages(); });
    }

    private static void AddCompanyLetterhead(ColumnDescriptor col, TenantSettings? s)
    {
        var name = s?.CompanyName.Length > 0 ? s.CompanyName : "[COMPANY NAME NOT SET — Go to Settings > Company Profile]";
        var addr = s?.RegisteredOfficeAddress.Length > 0 ? s.RegisteredOfficeAddress : "[Address not set]";
        col.Item().AlignCenter().Text(name).Bold().FontSize(13);
        col.Item().AlignCenter().Text(addr).FontSize(9);
        if (!string.IsNullOrEmpty(s?.PhoneNumber)) col.Item().AlignCenter().Text($"Ph: {s.PhoneNumber} | Email: {s.Email}").FontSize(9);
        if (!string.IsNullOrEmpty(s?.RegistrationNumber)) col.Item().AlignCenter().Text($"ROC Reg: {s.RegistrationNumber}{(s.GstNumber != null ? $"  |  GST: {s.GstNumber}" : "")}").FontSize(9);
        col.Item().PaddingTop(4).LineHorizontal(1);
        col.Item().PaddingBottom(4).LineHorizontal(0.5f);
    }

    // =====================================================================
    // FORM I — APPLICATION FOR PRIOR SANCTION  [Section 4 of Chit Funds Act 1982]
    // =====================================================================
    public byte[] GenerateSanctionForm(ChitGroup group, TenantSettings? settings = null)
    {
        var foremanCommissionAmount = group.ChitValue * group.ForemanCommissionPercent / 100;
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "I", "Section 4", "APPLICATION FOR SANCTION");
                    col.Item().PaddingTop(4).Text("(Application for prior sanction for the commencement or conduct of a Chit)").FontSize(9).AlignCenter();

                    col.Item().PaddingTop(15).Text($"Place: ________________________");
                    col.Item().Text($"Date:  {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Sir,");
                    col.Item().PaddingTop(5).Text(
                        $"I/We, the undersigned, hereby apply for sanction for the commencement or conduct of a Chit as per the following particulars:");

                    // Details table
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(30); c.RelativeColumn(3); c.RelativeColumn(2); });

                        table.Cell().Border(1).Padding(3).Text("Sl. No").SemiBold();
                        table.Cell().Border(1).Padding(3).Text("Particulars").SemiBold();
                        table.Cell().Border(1).Padding(3).Text("Details").SemiBold();

                        void Row(string sno, string label, string value) {
                            table.Cell().Border(1).Padding(3).Text(sno);
                            table.Cell().Border(1).Padding(3).Text(label);
                            table.Cell().Border(1).Padding(3).Text(value);
                        }

                        Row("1.", "Name and address of the Foreman / Company", "[Foreman / Company Name & Address]");
                        Row("2.", "Name of the Chit Group", group.GroupName);
                        Row("3.", "Gross amount of the Chit (Chit Value)", $"Rs. {group.ChitValue:N2}");
                        Row("4.", "Number of Subscribers (Duration / Tickets)", $"{group.DurationMonths}");
                        Row("5.", "Period of the Chit", $"{group.DurationMonths} months");
                        Row("6.", "Monthly Subscription (Installment per ticket)", $"Rs. {group.InstallmentAmount:N2}");
                        Row("7.", "Foreman's Commission (%)", $"{group.ForemanCommissionPercent}%");
                        Row("8.", "Foreman's Commission Amount (on Chit Value)", $"Rs. {foremanCommissionAmount:N2}");
                        Row("9.", "Date proposed to commence the Chit", group.LaunchDate.HasValue ? group.LaunchDate.Value.ToString("dd-MM-yyyy") : "To be fixed");
                        Row("10.", "Sanction Number (allotted by Registrar)", group.SanctionNumber ?? "Pending");
                        Row("11.", "Date of Sanction", group.SanctionDate.HasValue ? group.SanctionDate.Value.ToString("dd-MM-yyyy") : "Pending");
                        Row("12.", "Place where chit auctions will be held", group.AuctionVenueAddress ?? "[Not set — update Statutory Info]");
                    });

                    col.Item().PaddingTop(10).Text("I/We hereby certify that:");
                    col.Item().PaddingTop(5).Text("(a)  The total amount of all chits being conducted by me/us does not exceed the limits prescribed under the Chit Funds Act, 1982.");
                    col.Item().PaddingTop(3).Text("(b)  The required security deposit equal to the Chit Value (Rs. " + group.ChitValue.ToString("N2") + ") has been / will be deposited in an approved Scheduled Bank in the name of the Registrar before commencement.");
                    col.Item().PaddingTop(3).Text("(c)  A certified copy of the resolution passed by the Board of Directors / Managing Committee to conduct this chit is enclosed.");

                    col.Item().PaddingTop(5).Text($"I/We remit herewith a sum of Rs. {(group.FilingFees > 0 ? group.FilingFees.ToString("N2") : "__________")} (Rupees _________________________________________) being the fees prescribed for this application.");

                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                    col.Item().PaddingTop(20).Text("Enclosures:").SemiBold();
                    col.Item().Text("1.  Copy of resolution of Board of Directors / Managing Committee.");
                    col.Item().Text("2.  Copies of draft Chit Agreement and Bye-Laws.");
                    col.Item().Text("3.  Proof of security deposit arrangement.");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // FORM II — APPLICATION FOR REGISTRATION OF A CHIT  [Section 8 & Rule 5]
    // =====================================================================
    public byte[] GenerateAgreementForm(ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "II", "Section 8 and Rule 5", "APPLICATION FOR REGISTRATION OF A CHIT");

                    col.Item().PaddingTop(15).Text("Office of the Registrar of Chits, Tamil Nadu");
                    col.Item().Text($"Year: {DateTime.Now.Year}    Reg. No.: {group.RegistrationNumber ?? "_______________"}");

                    col.Item().PaddingTop(15).Text($"Place: {settings?.RegisteredOfficeAddress ?? "________________________"}");
                    col.Item().Text($"Date:  {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Sir,");
                    col.Item().PaddingTop(5).Text($"I/We apply herewith for the registration of the Chit Agreement of the Chit described below:");

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(30); c.RelativeColumn(3); c.RelativeColumn(2); });

                        table.Cell().Border(1).Padding(3).Text("Sl. No").SemiBold();
                        table.Cell().Border(1).Padding(3).Text("Particulars").SemiBold();
                        table.Cell().Border(1).Padding(3).Text("Details").SemiBold();

                        void Row(string sno, string label, string value) {
                            table.Cell().Border(1).Padding(3).Text(sno);
                            table.Cell().Border(1).Padding(3).Text(label);
                            table.Cell().Border(1).Padding(3).Text(value);
                        }

                        Row("1.", "Name of the Chit Group", group.GroupName);
                        Row("2.", "Name and address of the Foreman", settings != null ? $"{settings.CompanyName}, {settings.RegisteredOfficeAddress}" : "[Foreman / Company Name & Address]");
                        Row("3.", "Names and addresses of Subscribers", $"As per attached Annexure ({group.Tickets.Count} subscribers)");
                        Row("4.", "Gross amount of the Chit (Chit Value)", $"Rs. {group.ChitValue:N2}");
                        Row("5.", "Number of tickets", $"{group.DurationMonths}");
                        Row("6.", "Duration of the Chit", $"{group.DurationMonths} Months");
                        Row("7.", "Amount of monthly subscription", $"Rs. {group.InstallmentAmount:N2} per ticket");
                        Row("8.", "Foreman's Commission (%)", $"{group.ForemanCommissionPercent}% per chit");
                        Row("9.", "Date of commencement", group.LaunchDate.HasValue ? group.LaunchDate.Value.ToString("dd-MM-yyyy") : "To be fixed");
                        Row("10.", "Sanction Number", group.SanctionNumber ?? "Pending");
                        Row("11.", "Sanction Date", group.SanctionDate.HasValue ? group.SanctionDate.Value.ToString("dd-MM-yyyy") : "Pending");
                    });

                    col.Item().PaddingTop(15).Text("DETAILS OF SUBSCRIBERS").SemiBold().Underline();
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(40); c.RelativeColumn(3); c.RelativeColumn(3); c.ConstantColumn(80); });
                        table.Header(h =>
                        {
                            h.Cell().Border(1).Padding(3).Text("Sl. No").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Name of Subscriber").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Address").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Ticket No.").SemiBold();
                        });

                        int row = 1;
                        foreach (var ticket in group.Tickets.OrderBy(t => t.TicketNumber))
                        {
                            table.Cell().Border(1).Padding(3).Text(row++.ToString());
                            table.Cell().Border(1).Padding(3).Text(ticket.Member?.FullName ?? "Vacant");
                            table.Cell().Border(1).Padding(3).Text(ticket.Member?.Address ?? "—");
                            table.Cell().Border(1).Padding(3).Text(ticket.TicketNumber.ToString());
                        }
                    });

                    col.Item().PaddingTop(10).Text($"I/We remit herewith a sum of Rs. {(group.FilingFees > 0 ? group.FilingFees.ToString("N2") : "__________")} (Rupees _________________________________________) being the fees prescribed for registration of this chit.");
                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // BYE-LAWS OF THE CHIT GROUP
    // =====================================================================
    public byte[] GenerateByeLaws(ChitGroup group, TenantSettings? settings = null)
    {
        var foremanCommissionAmount = group.ChitValue * group.ForemanCommissionPercent / 100;
        var netPrizeAmount = group.ChitValue - foremanCommissionAmount;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    col.Item().AlignCenter().Text("BYE-LAWS").Bold().FontSize(16);
                    col.Item().PaddingTop(2).AlignCenter().Text($"OF").FontSize(12);
                    col.Item().AlignCenter().Text(group.GroupName.ToUpper()).Bold().FontSize(14);
                    col.Item().PaddingTop(4).AlignCenter().Text($"Chit Value: Rs. {group.ChitValue:N2} | Duration: {group.DurationMonths} Months | Monthly Installment: Rs. {group.InstallmentAmount:N2}").FontSize(9).Italic();

                    col.Item().PaddingTop(8).Text("FOREMAN").SemiBold();
                    col.Item().Text($"Name & Address: {(settings != null ? $"{settings.CompanyName}, {settings.RegisteredOfficeAddress}" : "[To be filled]")}");
                    col.Item().Text("Conducted under the Chit Funds Act, 1982 (Central Act 40 of 1982) and the Tamil Nadu Chit Funds Rules, 1984.");

                    var rules = new (string No, string Title, string Text)[]
                    {
                        ("1.", "Name & Nature", $"This Chit Group is named \"{group.GroupName}\" and is a monthly chit conducted by the Foreman pursuant to the provisions of the Chit Funds Act, 1982."),
                        ("2.", "Chit Value", $"The gross value of this Chit is Rs. {group.ChitValue:N2} (Rupees {group.ChitValue} Only)."),
                        ("3.", "Number of Subscribers", $"The total number of subscribers (tickets) shall be {group.DurationMonths}."),
                        ("4.", "Duration", $"The Chit shall run for a period of {group.DurationMonths} months from the date of commencement."),
                        ("5.", "Monthly Subscription", $"Each subscriber shall pay a monthly subscription of Rs. {group.InstallmentAmount:N2} per ticket on or before the auction date."),
                        ("6.", "Foreman's Commission", $"The Foreman shall be entitled to a commission of {group.ForemanCommissionPercent}% of the Chit Value, i.e., Rs. {foremanCommissionAmount:N2}, per installment, recovered equally from all subscribers."),
                        ("7.", "Auction", $"The Chit shall be conducted by way of auction. An auction shall be held once every month on a date and time determined by the Foreman. All subscribers shall be intimated in advance."),
                        ("8.", "Bid / Discount", $"Every subscriber who has not previously prized the Chit is eligible to bid. The highest bidder (one who agrees to the highest discount / lowest prize) shall be declared the prize winner. The dividend (discount divided equally among all subscribers) shall be deducted from the next installment due."),
                        ("9.", "Net Prize Amount", $"The net amount payable to the successful bidder shall be the Chit Value minus Foreman's Commission minus total discount bid, which shall not be less than Rs. {netPrizeAmount:N2}."),
                        ("10.", "Security", "Before a prize amount is paid, the successful bidder shall provide adequate security acceptable to the Foreman, such as sureties / guarantors of unprized subscribers or immovable property as security."),
                        ("11.", "Late Payment Penalty", $"A late fee of {group.LateFeePercent}% per month shall be levied on subscriptions not paid within {group.GracePeriodDays} days of the due date."),
                        ("12.", "Vacancy / Foreman's Ticket", "The Foreman shall conduct the auction for any ticket that remains unsubscribed. The Foreman's ticket, if any, shall not participate in bidding."),
                        ("13.", "Register of Chit", "The Foreman shall maintain a Register of Chit as prescribed under the Act and Rules, available for inspection by subscribers and the Registrar."),
                        ("14.", "Minutes / Records", "Minutes of every auction shall be recorded in the prescribed format (Form VIII) and filed with the Registrar as required by the Act."),
                        ("15.", "Dispute Redressal", "Any dispute between the Foreman and subscriber(s) or between subscribers arising out of this Chit shall be referred to the Registrar of Chits as per Section 64 of the Chit Funds Act, 1982."),
                        ("16.", "Governing Law", "These Bye-Laws shall be governed by the provisions of the Chit Funds Act, 1982 (Central Act 40 of 1982), the Tamil Nadu Chit Funds Rules, 1984, and any amendments thereto."),
                    };

                    foreach (var (no, title, text) in rules)
                    {
                        col.Item().PaddingTop(6).Row(row =>
                        {
                            row.ConstantItem(30).Text(no).SemiBold();
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(title).SemiBold();
                                c.Item().Text(text);
                            });
                        });
                    }

                    col.Item().PaddingTop(20).Text("Signed and adopted on this ________ day of __________________________ by:").Italic();
                    col.Item().PaddingTop(25).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text($"{settings?.ForemanName ?? "Foreman"}").SemiBold();
                            c.Item().Text($"{settings?.ForemanDesignation ?? "Authorized Signatory"}");
                            if (settings?.CompanyName != null) c.Item().Text(settings.CompanyName);
                        });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("Witness 1:").SemiBold(); c.Item().LineHorizontal(1);
                        });
                        row.ConstantItem(20);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().PaddingTop(30).LineHorizontal(1); c.Item().PaddingTop(3).Text("Witness 2:").SemiBold(); c.Item().LineHorizontal(1);
                        });
                    });
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // SECURITY DEPOSIT LETTER
    // =====================================================================
    public byte[] GenerateSecurityDepositLetter(ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    col.Item().AlignCenter().Text("SECURITY DEPOSIT LETTER").Bold().FontSize(14).Underline();
                    col.Item().PaddingTop(2).AlignCenter().Text("(To be submitted with the Registrar of Chits as proof of Security Deposit)").FontSize(9).Italic();

                    col.Item().PaddingTop(15).Text($"Date: {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Sir,");
                    col.Item().PaddingTop(5).Text($"Sub: Security Deposit for Chit Group \"{group.GroupName}\" — Reg.");

                    col.Item().PaddingTop(10).Text($"With reference to the above-mentioned chit group, we hereby confirm that we have made the following security deposit as required under Section 8 of the Chit Funds Act, 1982 (Central Act 40 of 1982):");

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(2); });

                        void Row(string label, string value) {
                            table.Cell().Border(1).Padding(5).Text(label).SemiBold();
                            table.Cell().Border(1).Padding(5).Text(value);
                        }

                        Row("Name of Chit Group", group.GroupName);
                        Row("Chit Value (Full Amount deposited as Security)", $"Rs. {group.ChitValue:N2}");
                        Row("Bank Name & Branch", group.SecurityDepositBankName != null ? $"{group.SecurityDepositBankName}, {group.SecurityDepositBankBranch}" : "[Not set — update Statutory Info]");
                        Row("FDR / Deposit Account Number", group.SecurityDepositFdrNumber ?? "[Not set — update Statutory Info]");
                        Row("Date of Deposit", group.SecurityDepositDate.HasValue ? group.SecurityDepositDate.Value.ToString("dd-MM-yyyy") : "[Not set]");
                        Row("Payable In Favour Of", "The Registrar of Chits, Tamil Nadu");
                    });

                    col.Item().PaddingTop(15).Text("We understand that this deposit is held as security for the due and faithful performance of our obligations as Foreman under the Chit Funds Act, 1982, and shall remain in force until the completion of the Chit.");
                    col.Item().PaddingTop(5).Text("A copy of the Fixed Deposit Receipt (FDR) / Bank Guarantee is enclosed herewith for your records.");

                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                    col.Item().PaddingTop(15).Text("Enclosure: Copy of Fixed Deposit Receipt / Bank Guarantee").Italic();
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // FORM V — DECLARATION OF FULL SUBSCRIPTION  [Section 9(1) & Rule 10]
    // =====================================================================
    public byte[] GenerateFormV(ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "V", "Section 9(1) and Rule 10", "DECLARATION OF FULL SUBSCRIPTION");

                    col.Item().PaddingTop(15).Text($"Place: {settings?.RegisteredOfficeAddress ?? "________________________"}");
                    col.Item().Text($"Date:  {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Dear Sir,");

                    col.Item().PaddingTop(10).Text(
                        "By your letter dated the ______________, you were pleased to grant us a Certificate of Registration to commence a Chit.");

                    col.Item().PaddingTop(10).Text(
                        $"I/We hereby declare in terms of Sub-section (1) of Section 9 of the Chit Funds Act, 1982 (Central Act 40 of 1982) that all the {group.DurationMonths} tickets specified in the Chit Agreement of the Chit Group \"{group.GroupName}\" with a Chit Value of Rs. {group.ChitValue:N2} have been fully subscribed as detailed below:");

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(40); c.RelativeColumn(3); c.ConstantColumn(80); });
                        table.Header(h =>
                        {
                            h.Cell().Border(1).Padding(3).Text("Ticket No").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Name of Subscriber").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Date of Subscription").SemiBold();
                        });
                        foreach (var ticket in group.Tickets.OrderBy(t => t.TicketNumber))
                        {
                            table.Cell().Border(1).Padding(3).Text(ticket.TicketNumber.ToString());
                            table.Cell().Border(1).Padding(3).Text(ticket.Member?.FullName ?? "Vacant");
                            table.Cell().Border(1).Padding(3).Text("______________");
                        }
                    });

                    col.Item().PaddingTop(15).Text($"I/We remit herewith a sum of Rs. {(group.FilingFees > 0 ? group.FilingFees.ToString("N2") : "__________")} (Rupees _________________________________________) being the fees prescribed for the purpose of filing this declaration.");

                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // FORM VI — CERTIFICATE OF COMMENCEMENT REQUEST  [Section 10 & Rule 11]
    // =====================================================================
    public byte[] GenerateFormVI(ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "VI", "Section 10 and Rule 11", "REQUEST FOR CERTIFICATE OF COMMENCEMENT OF A CHIT");

                    col.Item().PaddingTop(15).Text($"Place: {settings?.RegisteredOfficeAddress ?? "________________________"}");
                    col.Item().Text($"Date:  {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Dear Sir,");

                    col.Item().PaddingTop(10).Text($"Sub: Application for Certificate of Commencement for Chit Group \"{group.GroupName}\" — Reg.");

                    col.Item().PaddingTop(10).Text(
                        "With reference to the above, we have already filed the Declaration of Full Subscription under Form V and satisfied all conditions prescribed under the Chit Funds Act, 1982.");

                    col.Item().PaddingTop(10).Text("We hereby confirm that:");
                    col.Item().PaddingTop(5).Text($"1.  The Chit Group \"{group.GroupName}\" with a Chit Value of Rs. {group.ChitValue:N2} and duration of {group.DurationMonths} months has been duly registered.");
                    col.Item().PaddingTop(3).Text($"2.  All {group.DurationMonths} tickets have been subscribed. Monthly installment per ticket is Rs. {group.InstallmentAmount:N2}.");
                    col.Item().PaddingTop(3).Text($"3.  Security deposit equal to the Chit Value (Rs. {group.ChitValue:N2}) has been deposited in the name of the Registrar of Chits at an approved Scheduled Bank.");
                    col.Item().PaddingTop(3).Text($"4.  Copies of the Chit Agreement have been / will be distributed to all subscribers.");
                    col.Item().PaddingTop(3).Text($"5.  The proposed date of the first auction is: {(group.LaunchDate.HasValue ? group.LaunchDate.Value.ToString("dd-MM-yyyy") : "_______________________")}.");

                    col.Item().PaddingTop(15).Text("We, therefore, request you to grant us a Certificate of Commencement (Form VI) for the above Chit Group at the earliest, so that the first auction may be held as planned.");

                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                    col.Item().PaddingTop(20).Text("Enclosures:").SemiBold();
                    col.Item().Text("1.  Copy of Form V (Declaration of Full Subscription).");
                    col.Item().Text("2.  Copy of Security Deposit Receipt.");
                    col.Item().Text("3.  Copy of the Chit Registration Certificate.");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // FORM VII — CONFIRMATION OF AGREEMENTS TO SUBSCRIBERS  [Section 11 & Rule 12]
    // =====================================================================
    public byte[] GenerateFormVII(ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "VII", "Section 11 and Rule 12", "CERTIFICATE BY THE FOREMAN ABOUT FURNISHING COPIES OF CHIT AGREEMENT TO SUBSCRIBERS");

                    col.Item().PaddingTop(15).Text($"Place: {settings?.RegisteredOfficeAddress ?? "________________________"}");
                    col.Item().Text($"Date:  {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(10).Text("To");
                    col.Item().Text("The Registrar of Chits,");
                    col.Item().Text("Tamil Nadu.");
                    col.Item().PaddingTop(10).Text("Dear Sir,");

                    col.Item().PaddingTop(10).Text($"Sub: Furnishing copies of Chit Agreement to subscribers of \"{group.GroupName}\" — Certificate — Reg.");

                    col.Item().PaddingTop(10).Text(
                        $"I/We hereby certify that on the date mentioned against each name hereunder, the true certified copy of the Chit Agreement of the Chit Group \"{group.GroupName}\" with Chit Value of Rs. {group.ChitValue:N2} has been delivered to each of the {group.Tickets.Count} subscribers as required under Section 11 of the Chit Funds Act, 1982 (Central Act 40 of 1982):");

                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(40); c.RelativeColumn(3); c.ConstantColumn(100); c.ConstantColumn(100); });
                        table.Header(h =>
                        {
                            h.Cell().Border(1).Padding(3).Text("Ticket No").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Name of Subscriber").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Date of Delivery").SemiBold();
                            h.Cell().Border(1).Padding(3).Text("Signature / Acknowledgment").SemiBold();
                        });
                        foreach (var ticket in group.Tickets.OrderBy(t => t.TicketNumber))
                        {
                            table.Cell().Border(1).Padding(3).Text(ticket.TicketNumber.ToString());
                            table.Cell().Border(1).Padding(3).Text(ticket.Member?.FullName ?? "Vacant");
                            table.Cell().Border(1).Padding(3).Text("______________");
                            table.Cell().Border(1).Padding(3).Text("");
                        }
                    });

                    col.Item().PaddingTop(15).Text($"I/We remit herewith a sum of Rs. {(group.FilingFees > 0 ? group.FilingFees.ToString("N2") : "__________")} (Rupees _________________________________________) being the fees prescribed for filing this certificate.");

                    AddSignatureBlock(col, settings?.CompanyName ?? group.GroupName, settings?.ForemanName ?? "[Foreman Name]");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: SUBSCRIBER AGREEMENT (Individual)
    // =====================================================================
    public byte[] GenerateSubscriberAgreement(ChitGroup group, Ticket ticket, TenantSettings? settings = null)
    {
        var foremanCommissionAmount = group.ChitValue * group.ForemanCommissionPercent / 100;
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    col.Item().AlignCenter().Text("CHIT AGREEMENT").Bold().FontSize(16);
                    col.Item().AlignCenter().Text($"(Under the Chit Funds Act, 1982)").FontSize(10).Italic();
                    col.Item().PaddingTop(5).AlignCenter().Text($"Group: {group.GroupName}  |  Ticket No: {ticket.TicketNumber}").FontSize(10).SemiBold();

                    col.Item().PaddingTop(10).Text($"AGREEMENT made on {DateTime.Now:dd-MMMM-yyyy} between:");
                    col.Item().PaddingTop(10).Text("1. THE FOREMAN").SemiBold();
                    col.Item().Text(settings?.CompanyName ?? "[Company Name, Registration Number]").Bold();
                    col.Item().Text(settings?.RegisteredOfficeAddress ?? "[Registered Office Address]");
                    col.Item().Text($"Represented by {settings?.ForemanName ?? "Authorized Signatory"} ({settings?.ForemanDesignation ?? "Authorized Signatory"}).");

                    col.Item().PaddingTop(10).Text("AND");
                    col.Item().PaddingTop(10).Text("2. THE SUBSCRIBER").SemiBold();
                    col.Item().Text($"Name: {ticket.Member?.FullName ?? "N/A"}").Bold();
                    col.Item().Text($"Address: {ticket.Member?.Address ?? "—"}");
                    col.Item().Text($"Phone: {ticket.Member?.PhoneNumber ?? "—"}");
                    col.Item().Text($"PAN: {ticket.Member?.PanNumber ?? "—"}   Aadhaar: {ticket.Member?.AadhaarNumber ?? "—"}");

                    col.Item().PaddingTop(15).Text("CHIT PARTICULARS").SemiBold().Underline();
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Row(string l, string v) { table.Cell().Border(1).Padding(4).Text(l); table.Cell().Border(1).Padding(4).Text(v).SemiBold(); }
                        Row("Chit Group Name", group.GroupName);
                        Row("Chit Value (Gross)", $"Rs. {group.ChitValue:N2}");
                        Row("Number of Subscribers / Tickets", group.DurationMonths.ToString());
                        Row("Duration", $"{group.DurationMonths} Months");
                        Row("Monthly Subscription per Ticket", $"Rs. {group.InstallmentAmount:N2}");
                        Row("Foreman's Commission", $"{group.ForemanCommissionPercent}% = Rs. {foremanCommissionAmount:N2}");
                        Row("Commencement Date", group.LaunchDate.HasValue ? group.LaunchDate.Value.ToString("dd-MM-yyyy") : "To be fixed");
                        Row("Ticket Number", ticket.TicketNumber.ToString());
                    });

                    col.Item().PaddingTop(15).Text("TERMS AND CONDITIONS").SemiBold().Underline();
                    var terms = new[]
                    {
                        "The Subscriber shall pay the monthly subscription as specified above on or before the auction date each month, failing which a late fee shall be levied as prescribed in the Bye-Laws.",
                        "The Foreman shall be entitled to a commission of " + group.ForemanCommissionPercent + "% of the Chit Value (Rs. " + foremanCommissionAmount.ToString("N2") + ") per period.",
                        "Every subscriber who has not previously prized the Chit shall be eligible to participate in the monthly auction. The highest bidder (lowest prize acceptor) wins.",
                        "The successful bidder shall provide security acceptable to the Foreman before claiming the prize money.",
                        "After prizing the Chit, the subscriber must continue to pay monthly subscriptions for the remaining duration.",
                        "Any default in payment shall entitle the Foreman to file a suit for recovery as per the provisions of the Chit Funds Act, 1982.",
                        "Disputes shall be resolved as per Section 64 of the Chit Funds Act, 1982.",
                    };
                    int tno = 1;
                    foreach (var term in terms) { col.Item().PaddingTop(4).Text($"{tno++}.  {term}"); }

                    col.Item().PaddingTop(30).Row(row =>
                    {
                        row.RelativeItem().Column(c => { c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("Foreman / Authorized Signatory").SemiBold(); c.Item().Text("(With Company Seal)"); });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(c => { c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text($"Subscriber — {ticket.Member?.FullName ?? ""}").SemiBold(); });
                    });
                    col.Item().PaddingTop(20).Text("Witnesses:").SemiBold();
                    col.Item().PaddingTop(15).Text("1. ___________________________   Name: ___________________________   Address: ___________________________");
                    col.Item().PaddingTop(10).Text("2. ___________________________   Name: ___________________________   Address: ___________________________");
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: FORM VIII — MINUTES OF AUCTION  [Section 23]
    // =====================================================================
    public byte[] GenerateMinutesForm(Auction auction, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    AddCompanyLetterhead(col, settings);
                    AddHeader(col, "VIII", "Section 23", "MINUTES OF PROCEEDINGS OF AUCTION");
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(3); });
                        void Row(string l, string v) { table.Cell().Border(1).Padding(4).Text(l); table.Cell().Border(1).Padding(4).Text(v); }
                        Row("1.  Name of Chit Group:", auction.ChitGroup?.GroupName ?? "—");
                        Row("2.  Date and Time of Auction:", auction.AuctionDate.ToString("dd-MMMM-yyyy hh:mm tt"));
                        Row("3.  Installment Number:", auction.InstallmentNumber.ToString());
                        Row("4.  Total Number of Tickets:", auction.ChitGroup?.Tickets.Count.ToString() ?? "—");
                        Row("5.  Winning Ticket Number:", auction.WinningTicketId?.ToString() ?? "—");
                        Row("6.  Gross Chit Value:", $"Rs. {auction.ChitGroup?.ChitValue:N2}");
                        Row("7.  Winning Bid / Discount Amount:", $"Rs. {auction.WinningBidAmount:N2}");
                        Row("8.  Dividend per Ticket:", $"Rs. {auction.DividendAmount:N2}");
                        Row("9.  Foreman's Commission:", $"Rs. {auction.ForemanCommissionAmount:N2}");
                        Row("10. Net Amount Payable to Winner:", $"Rs. {auction.NetPayableAmount:N2}");
                    });

                    col.Item().PaddingTop(20).Text("We certify that the above particulars are true and correct and the auction was conducted fairly and in accordance with the provisions of the Chit Funds Act, 1982 and the Bye-Laws of the Chit Group.").FontSize(10);

                    col.Item().PaddingTop(30).Row(row =>
                    {
                        row.RelativeItem().Column(c => { c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("Foreman / Authorized Signatory").SemiBold(); });
                        row.ConstantItem(40);
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("Witness 1:").SemiBold();
                            c.Item().PaddingTop(15).LineHorizontal(1); c.Item().PaddingTop(3).Text("Witness 2:").SemiBold();
                        });
                    });
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: DEMAND NOTICE
    // =====================================================================
    public byte[] GenerateDemandNotice(Demand demand, Member member, ChitGroup group, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));
                page.Footer().AlignCenter().Text(x => { x.Span("Page "); x.CurrentPageNumber(); });
            });
            container.Page(page =>
            {
                page.Content().Column(c =>
                {
                    AddCompanyLetterhead(c, settings);
                    c.Item().AlignCenter().Text("PAYMENT DEMAND NOTICE").SemiBold().FontSize(14).Underline();
                    c.Item().PaddingTop(10).Text($"Date: {DateTime.Now:dd-MM-yyyy}");
                    c.Item().PaddingTop(10).Text("To,");
                    c.Item().Text(member.FullName).SemiBold();
                    c.Item().Text(member.Address ?? "—");
                    c.Item().Text($"Mobile: {member.PhoneNumber}");
                    c.Item().PaddingTop(10).Text($"Dear Subscriber,");
                    c.Item().PaddingTop(5).Text($"This is to inform you that the auction for Installment No. {demand.InstallmentNumber} of Chit Group \"{group.GroupName}\" has been duly conducted and the amount due from you is as follows:");
                    c.Item().PaddingTop(8).Border(1).Padding(5).Table(table =>
                    {
                        table.ColumnsDefinition(cols => { cols.RelativeColumn(); cols.RelativeColumn(); });
                        void Row(string l, string v) { table.Cell().Text(l); table.Cell().AlignRight().Text(v); }
                        Row("Monthly Installment Amount:", $"Rs. {group.InstallmentAmount:N2}");
                        Row("Less: Dividend (Discount Share):", $"Rs. {demand.DividendAmount:N2}");
                        table.Cell().PaddingTop(3).BorderTop(1).Text("Net Amount Payable:").SemiBold();
                        table.Cell().PaddingTop(3).BorderTop(1).AlignRight().Text($"Rs. {demand.NetAmount:N2}").SemiBold();
                    });
                    c.Item().PaddingTop(10).Text("Please pay the above amount on or before ____________ to avoid late payment fees.");
                    c.Item().PaddingTop(20).Text("Yours faithfully,");
                    c.Item().Text(settings?.CompanyName ?? "[Chit Fund Company Name]").SemiBold();
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: RECEIPT
    // =====================================================================
    public byte[] GenerateReceipt(Receipt receipt, Member member, ChitGroup group, TenantSettings? settings = null)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text(settings?.CompanyName ?? "[CHIT FUND COMPANY NAME]").FontSize(14).Bold();
                        col.Item().Text(settings?.RegisteredOfficeAddress ?? "[Regd Office Address]").FontSize(8);
                        col.Item().Text((settings?.PhoneNumber != null ? $"Ph: {settings.PhoneNumber}" : "") + (settings?.Email != null ? $" | {settings.Email}" : "")).FontSize(8);
                    });
                    row.ConstantItem(100).AlignRight().Column(col =>
                    {
                        col.Item().Text("PAYMENT RECEIPT").FontSize(12).Bold().Underline();
                        col.Item().Text($"No: {receipt.Id}").Bold();
                        col.Item().Text($"Date: {receipt.ReceiptDate:dd-MM-yyyy}");
                    });
                });
                page.Content().PaddingVertical(8).Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Received with thanks from: {member.FullName}").Bold();
                            c.Item().Text($"Ticket No: {receipt.Ticket.TicketNumber}  |  Group: {group.GroupName}");
                        });
                    });
                    col.Item().PaddingVertical(5).LineHorizontal(1);
                    col.Item().Row(row => { row.RelativeItem().Text("Particulars").Bold(); row.ConstantItem(100).AlignRight().Text("Amount (Rs.)").Bold(); });
                    col.Item().PaddingVertical(2).LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text($"Subscription — Installment for {receipt.ReceiptDate:MMMM yyyy}");
                        row.ConstantItem(100).AlignRight().Text($"{receipt.AmountReceived:N2}");
                    });
                    if (receipt.PaymentMode != "Cash") {
                        col.Item().Row(row => { row.RelativeItem().Text($"Mode: {receipt.PaymentMode}  |  Ref: {receipt.ReferenceNumber}").FontSize(8).Italic(); });
                    }
                    col.Item().PaddingVertical(5).LineHorizontal(1);
                    col.Item().Row(row => { row.RelativeItem().AlignRight().Text("Total:").Bold(); row.ConstantItem(100).AlignRight().Text($"{receipt.AmountReceived:N2}").Bold(); });
                });
                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text("Computer Generated Receipt.").FontSize(8).FontColor(Colors.Grey.Medium);
                    row.RelativeItem().AlignRight().Text("Authorized Signatory").Bold();
                });
            });
        }).GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: BALANCE SHEET
    // =====================================================================
    public byte[] GenerateBalanceSheet(List<AccountHead> accounts, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    col.Item().AlignCenter().Text("FORM XI").Bold().FontSize(14);
                    col.Item().AlignCenter().Text("Balance Sheet").SemiBold().FontSize(12).Underline();
                    col.Item().AlignCenter().Text($"As on {DateTime.Now:dd-MM-yyyy}");
                    col.Item().PaddingTop(15).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(); c.ConstantColumn(100); c.RelativeColumn(); c.ConstantColumn(100); });
                        table.Header(h =>
                        {
                            h.Cell().Border(1).Padding(5).Text("Liabilities").SemiBold();
                            h.Cell().Border(1).Padding(5).AlignRight().Text("Rs.").SemiBold();
                            h.Cell().Border(1).Padding(5).Text("Assets").SemiBold();
                            h.Cell().Border(1).Padding(5).AlignRight().Text("Rs.").SemiBold();
                        });
                        var assets = accounts.Where(a => a.Type == AccountType.Asset).ToList();
                        var liabilities = accounts.Where(a => a.Type == AccountType.Liability || a.Type == AccountType.Income).ToList();
                        int maxRows = Math.Max(assets.Count, liabilities.Count);
                        for (int i = 0; i < maxRows; i++)
                        {
                            if (i < liabilities.Count) { table.Cell().Border(1).Padding(2).Text(liabilities[i].AccountName); table.Cell().Border(1).Padding(2).AlignRight().Text("—"); }
                            else { table.Cell().Border(1).Padding(2).Text(""); table.Cell().Border(1).Padding(2).Text(""); }
                            if (i < assets.Count) { table.Cell().Border(1).Padding(2).Text(assets[i].AccountName); table.Cell().Border(1).Padding(2).AlignRight().Text("—"); }
                            else { table.Cell().Border(1).Padding(2).Text(""); table.Cell().Border(1).Padding(2).Text(""); }
                        }
                    });
                });
            });
        });
        return document.GeneratePdf();
    }

    // =====================================================================
    // OPERATIONAL: KYC FORM
    // =====================================================================
    public byte[] GenerateKycForm(Member member, TenantSettings? settings = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                AddPageSetup(page);
                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(col =>
                {
                    col.Item().AlignCenter().Text("KNOW YOUR CUSTOMER (KYC) FORM").Bold().FontSize(14).Underline();
                    col.Item().PaddingTop(5).Text("Subscriber Information").SemiBold().FontSize(13);
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.ConstantColumn(150); c.RelativeColumn(); });
                        void Row(string l, string v) { table.Cell().Border(1).Padding(4).Text(l); table.Cell().Border(1).Padding(4).Text(v).SemiBold(); }
                        Row("Full Name:", member.FullName);
                        Row("Phone Number:", member.PhoneNumber);
                        Row("Email:", member.Email ?? "—");
                        Row("PAN Number:", member.PanNumber ?? "Pending");
                        Row("Aadhaar Number:", member.AadhaarNumber ?? "Pending");
                        Row("Address:", member.Address ?? "—");
                        Row("Date of Registration:", DateTime.Now.ToString("dd-MM-yyyy"));
                    });
                    col.Item().PaddingTop(20).Text("Declaration").SemiBold().FontSize(13).Underline();
                    col.Item().PaddingTop(10).Text("I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief and I undertake to inform the Chit Fund Company of any changes therein immediately. In case any of the above information is found to be false or untrue or misleading or misrepresenting, I am aware that I may be held liable for it.");
                    col.Item().PaddingTop(60).Row(row =>
                    {
                        row.RelativeItem().Column(c => { c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("Signature of Subscriber").SemiBold(); c.Item().Text($"Name: {member.FullName}"); c.Item().Text($"Date: {DateTime.Now:dd-MM-yyyy}"); });
                        row.ConstantItem(50);
                        row.RelativeItem().Column(c => { c.Item().LineHorizontal(1); c.Item().PaddingTop(3).Text("For Office Use Only").SemiBold(); c.Item().PaddingTop(30).Text("Authorized Signatory"); });
                    });
                });
            });
        });
        return document.GeneratePdf();
    }
}
