using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Settings.Commands;

// DTO for reading settings
public class TenantSettingsDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public string RegisteredOfficeAddress { get; set; } = string.Empty;
    public string ForemanName { get; set; } = string.Empty;
    public string ForemanDesignation { get; set; } = "Authorized Signatory";
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal StatutoryFilingFees { get; set; }
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public decimal MaxBiddingDiscountPercent { get; set; }
    public decimal TdsPercent { get; set; }
    public decimal GstPercent { get; set; }
    public decimal DefaultLateFeePercent { get; set; }
    public int DefaultGracePeriodDays { get; set; }
    public bool LiveRoomTtsEnabled { get; set; }
    public string PreferredAuctionVoiceLanguage { get; set; } = "en";
}

// Command: Upsert (create or update) the company profile
public class UpsertTenantSettingsCommand : IRequest<Result<TenantSettingsDto>>
{
    public string CompanyName { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public string RegisteredOfficeAddress { get; set; } = string.Empty;
    public string ForemanName { get; set; } = string.Empty;
    public string ForemanDesignation { get; set; } = "Authorized Signatory";
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal StatutoryFilingFees { get; set; }
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public decimal MaxBiddingDiscountPercent { get; set; }
    public decimal TdsPercent { get; set; }
    public decimal GstPercent { get; set; }
    public decimal DefaultLateFeePercent { get; set; } = 2;
    public int DefaultGracePeriodDays { get; set; } = 5;
    public bool LiveRoomTtsEnabled { get; set; } = false;
    public string PreferredAuctionVoiceLanguage { get; set; } = "en";
}

public class UpsertTenantSettingsValidator : AbstractValidator<UpsertTenantSettingsCommand>
{
    public UpsertTenantSettingsValidator()
    {
        RuleFor(v => v.CompanyName).NotEmpty().WithMessage("Company Name is required.").MaximumLength(200);
        RuleFor(v => v.RegisteredOfficeAddress).NotEmpty().WithMessage("Registered Office Address is required.").MaximumLength(500);
        RuleFor(v => v.ForemanName).NotEmpty().WithMessage("Foreman Name is required.").MaximumLength(200);
        RuleFor(v => v.PreferredAuctionVoiceLanguage)
            .NotEmpty()
            .Must(v => SupportedVoiceLanguages.Contains(v.Trim().ToLowerInvariant()))
            .WithMessage("Preferred auction voice language must be one of: en, hi, ta, te, kn, ml.");
    }

    private static readonly HashSet<string> SupportedVoiceLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "en", "hi", "ta", "te", "kn", "ml"
    };
}

public class UpsertTenantSettingsHandler : IRequestHandler<UpsertTenantSettingsCommand, Result<TenantSettingsDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantService _tenantService;

    public UpsertTenantSettingsHandler(IApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Result<TenantSettingsDto>> Handle(UpsertTenantSettingsCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);

        if (existing == null)
        {
            existing = new TenantSettings();
            _context.TenantSettings.Add(existing);
        }

        existing.CompanyName = request.CompanyName;
        existing.RegistrationNumber = request.RegistrationNumber;
        existing.RegisteredOfficeAddress = request.RegisteredOfficeAddress;
        existing.ForemanName = request.ForemanName;
        existing.ForemanDesignation = request.ForemanDesignation;
        existing.PhoneNumber = request.PhoneNumber;
        existing.Email = request.Email;
        existing.StatutoryFilingFees = request.StatutoryFilingFees;
        existing.GstNumber = request.GstNumber;
        existing.PanNumber = request.PanNumber;
        existing.MaxBiddingDiscountPercent = request.MaxBiddingDiscountPercent;
        existing.TdsPercent = request.TdsPercent;
        existing.GstPercent = request.GstPercent;
        existing.DefaultLateFeePercent = request.DefaultLateFeePercent;
        existing.DefaultGracePeriodDays = request.DefaultGracePeriodDays;
        existing.LiveRoomTtsEnabled = request.LiveRoomTtsEnabled;
        existing.PreferredAuctionVoiceLanguage = request.PreferredAuctionVoiceLanguage.Trim().ToLowerInvariant();

        await _context.SaveChangesAsync(cancellationToken);

        return Result<TenantSettingsDto>.Success(MapToDto(existing));
    }

    private static TenantSettingsDto MapToDto(TenantSettings s) => new()
    {
        Id = s.Id,
        CompanyName = s.CompanyName,
        RegistrationNumber = s.RegistrationNumber,
        RegisteredOfficeAddress = s.RegisteredOfficeAddress,
        ForemanName = s.ForemanName,
        ForemanDesignation = s.ForemanDesignation,
        PhoneNumber = s.PhoneNumber,
        Email = s.Email,
        StatutoryFilingFees = s.StatutoryFilingFees,
        GstNumber = s.GstNumber,
        PanNumber = s.PanNumber,
        MaxBiddingDiscountPercent = s.MaxBiddingDiscountPercent,
        TdsPercent = s.TdsPercent,
        GstPercent = s.GstPercent,
        DefaultLateFeePercent = s.DefaultLateFeePercent,
        DefaultGracePeriodDays = s.DefaultGracePeriodDays,
        LiveRoomTtsEnabled = s.LiveRoomTtsEnabled,
        PreferredAuctionVoiceLanguage = s.PreferredAuctionVoiceLanguage,
    };
}

// Query: Get current settings
public class GetTenantSettingsQuery : IRequest<Result<TenantSettingsDto>> { }

public class GetTenantSettingsHandler : IRequestHandler<GetTenantSettingsQuery, Result<TenantSettingsDto>>
{
    private readonly IApplicationDbContext _context;
    public GetTenantSettingsHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<TenantSettingsDto>> Handle(GetTenantSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return Result<TenantSettingsDto>.Success(new TenantSettingsDto()); // return empty defaults

        return Result<TenantSettingsDto>.Success(new TenantSettingsDto
        {
            Id = settings.Id,
            CompanyName = settings.CompanyName,
            RegistrationNumber = settings.RegistrationNumber,
            RegisteredOfficeAddress = settings.RegisteredOfficeAddress,
            ForemanName = settings.ForemanName,
            ForemanDesignation = settings.ForemanDesignation,
            PhoneNumber = settings.PhoneNumber,
            Email = settings.Email,
            StatutoryFilingFees = settings.StatutoryFilingFees,
            GstNumber = settings.GstNumber,
            PanNumber = settings.PanNumber,
            MaxBiddingDiscountPercent = settings.MaxBiddingDiscountPercent,
            TdsPercent = settings.TdsPercent,
            GstPercent = settings.GstPercent,
            DefaultLateFeePercent = settings.DefaultLateFeePercent,
            DefaultGracePeriodDays = settings.DefaultGracePeriodDays,
            LiveRoomTtsEnabled = settings.LiveRoomTtsEnabled,
            PreferredAuctionVoiceLanguage = settings.PreferredAuctionVoiceLanguage,
        });
    }
}
