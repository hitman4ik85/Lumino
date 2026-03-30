using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class KyivTimeVocabularyServiceTests
{
    [Fact]
    public void GetDueVocabulary_AfterKyivMidnight_ReturnsOnlyWordsDueByCurrentMoment()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 29, 21, 30, 0, DateTimeKind.Utc);

        dbContext.VocabularyItems.AddRange(
            new VocabularyItem
            {
                Id = 1,
                Word = "sun",
                Translation = "сонце"
            },
            new VocabularyItem
            {
                Id = 2,
                Word = "moon",
                Translation = "місяць"
            }
        );

        dbContext.UserVocabularies.AddRange(
            new UserVocabulary
            {
                Id = 1,
                UserId = 7,
                VocabularyItemId = 1,
                AddedAt = now.AddDays(-2),
                NextReviewAt = now.AddMinutes(-30),
                ReviewCount = 1
            },
            new UserVocabulary
            {
                Id = 2,
                UserId = 7,
                VocabularyItemId = 2,
                AddedAt = now.AddDays(-2),
                NextReviewAt = now.AddMinutes(30),
                ReviewCount = 1
            }
        );

        dbContext.SaveChanges();

        var service = new VocabularyService(
            dbContext,
            new FixedDateTimeProvider(now),
            Options.Create(new LearningSettings())
        );

        var result = service.GetDueVocabulary(7);

        Assert.Single(result);
        Assert.Equal(1, result[0].VocabularyItemId);
        Assert.Equal("sun", result[0].Word);
    }

    [Fact]
    public void ScheduleReview_Tomorrow_AfterKyivMidnight_UsesCurrentMoment()
    {
        var dbContext = TestDbContextFactory.Create();
        var now = new DateTime(2026, 3, 29, 21, 30, 0, DateTimeKind.Utc);

        dbContext.VocabularyItems.Add(new VocabularyItem
        {
            Id = 1,
            Word = "sun",
            Translation = "сонце"
        });

        dbContext.UserVocabularies.Add(new UserVocabulary
        {
            Id = 15,
            UserId = 7,
            VocabularyItemId = 1,
            AddedAt = now.AddDays(-2),
            NextReviewAt = now,
            ReviewCount = 1
        });

        dbContext.SaveChanges();

        var service = new VocabularyService(
            dbContext,
            new FixedDateTimeProvider(now),
            Options.Create(new LearningSettings())
        );

        service.ScheduleReview(7, 15, new ScheduleVocabularyReviewRequest
        {
            Period = "tomorrow"
        });

        var entity = dbContext.UserVocabularies.Single(x => x.Id == 15);

        Assert.Equal(now.AddDays(1), entity.NextReviewAt);
    }
}
