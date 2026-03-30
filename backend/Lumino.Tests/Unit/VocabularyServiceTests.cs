using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests;

public class VocabularyServiceTests
{
    [Fact]
    public void AddWord_ShouldCreateVocabularyItem_AndUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "hello",
            Translation = "привіт",
            Example = "Hello, world!"
        });

        var items = dbContext.VocabularyItems.ToList();
        var userWords = dbContext.UserVocabularies.ToList();

        Assert.Single(items);
        Assert.Single(userWords);

        Assert.Equal("hello", items[0].Word);
        Assert.Equal("привіт", items[0].Translation);

        Assert.Single(dbContext.VocabularyItemTranslations);
        Assert.Equal(items[0].Id, dbContext.VocabularyItemTranslations.First().VocabularyItemId);
        Assert.Equal("привіт", dbContext.VocabularyItemTranslations.First().Translation);
        Assert.Equal(0, dbContext.VocabularyItemTranslations.First().Order);

        Assert.Equal(1, userWords[0].UserId);
        Assert.Equal(items[0].Id, userWords[0].VocabularyItemId);

        Assert.Equal(now, userWords[0].AddedAt);
        Assert.Equal(now, userWords[0].NextReviewAt);
        Assert.Null(userWords[0].LastReviewedAt);
        Assert.Equal(0, userWords[0].ReviewCount);
    }



    [Fact]
    public void AddWord_WhenWordExists_AndTranslationNotProvided_ShouldCreateOwnCopyForAnotherUser()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "apple",
            Translation = "яблуко",
            PartOfSpeech = "noun",
            Definition = "Плід яблуні"
        });

        service.AddWord(userId: 2, new AddVocabularyRequest
        {
            Word = "apple"
        });

        Assert.Equal(2, dbContext.VocabularyItems.Count());

        var items = dbContext.VocabularyItems.OrderBy(x => x.Id).ToList();
        Assert.All(items, x => Assert.Equal("apple", x.Word));
        Assert.All(items, x => Assert.Equal("яблуко", x.Translation));
        Assert.All(items, x => Assert.Equal("noun", x.PartOfSpeech));
        Assert.All(items, x => Assert.Equal("Плід яблуні", x.Definition));

        var userWords = dbContext.UserVocabularies.OrderBy(x => x.UserId).ToList();
        Assert.Equal(2, userWords.Count);
        Assert.Equal(1, userWords[0].UserId);
        Assert.Equal(2, userWords[1].UserId);
        Assert.NotEqual(userWords[0].VocabularyItemId, userWords[1].VocabularyItemId);
    }

    [Fact]
    public void AddWord_WithMultipleTranslations_ShouldSaveAllTranslations_AndKeepPrimaryInTranslation()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "run",
            Translation = "бігти",
            Translations = new List<string> { "запускати", "бігти" }
        });

        Assert.Single(dbContext.VocabularyItems);

        var item = dbContext.VocabularyItems.First();
        Assert.Equal("run", item.Word);
        Assert.Equal("бігти", item.Translation);

        var translations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == item.Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Equal(2, translations.Count);
        Assert.Equal("бігти", translations[0]);
        Assert.Equal("запускати", translations[1]);

        var due = service.GetDueVocabulary(userId: 1);
        Assert.Single(due);

        Assert.Equal("бігти", due[0].Translation);
        Assert.Equal(2, due[0].Translations.Count);
    }


    [Fact]
    public void AddWord_WhenSameUserAddsSameWordWithAnotherTranslation_ShouldMergeTranslationsWithoutDuplicate()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "run",
            Translation = "бігти"
        });

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "run",
            Translation = "запускати"
        });

        Assert.Single(dbContext.UserVocabularies);
        Assert.Single(dbContext.VocabularyItems);

        var item = dbContext.VocabularyItems.Single();
        var translations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == item.Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Equal("run", item.Word);
        Assert.Equal("бігти", item.Translation);
        Assert.Equal(new List<string> { "бігти", "запускати" }, translations);
    }

    [Fact]
    public void AddWord_SameWordWithDifferentPrimaryTranslation_ShouldCreateSeparateUserItem()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "run",
            Translation = "бігти",
            Translations = new List<string> { "запускати" }
        });

        service.AddWord(userId: 2, new AddVocabularyRequest
        {
            Word = "run",
            Translation = "запускати"
        });

        Assert.Equal(2, dbContext.VocabularyItems.Count());

        var items = dbContext.VocabularyItems.OrderBy(x => x.Id).ToList();
        Assert.Equal("бігти", items[0].Translation);
        Assert.Equal("запускати", items[1].Translation);

        var firstTranslations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == items[0].Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        var secondTranslations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == items[1].Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Equal(new List<string> { "бігти", "запускати" }, firstTranslations);
        Assert.Equal(new List<string> { "запускати" }, secondTranslations);
        Assert.Equal(2, dbContext.UserVocabularies.Count());
    }

    [Fact]
    public void UpdateWord_WhenItemIsSharedWithLesson_ShouldCreatePrivateCopy_AndKeepGlobalUntouched()
    {
        var dbContext = TestDbContextFactory.Create();

        dbContext.VocabularyItems.Add(new Lumino.Api.Domain.Entities.VocabularyItem
        {
            Id = 1,
            Word = "run",
            Translation = "бігти",
            Definition = "Глобальна дефініція"
        });

        dbContext.VocabularyItemTranslations.Add(new Lumino.Api.Domain.Entities.VocabularyItemTranslation
        {
            VocabularyItemId = 1,
            Translation = "бігти",
            Order = 0
        });

        dbContext.Lessons.Add(new Lumino.Api.Domain.Entities.Lesson
        {
            Id = 1,
            TopicId = 1,
            Title = "Lesson",
            Theory = "Theory",
            Order = 1
        });

        dbContext.Topics.Add(new Lumino.Api.Domain.Entities.Topic
        {
            Id = 1,
            CourseId = 1,
            Title = "Topic",
            Order = 1
        });

        dbContext.Courses.Add(new Lumino.Api.Domain.Entities.Course
        {
            Id = 1,
            Title = "Course",
            Description = "Description",
            LanguageCode = "en",
            Order = 1
        });

        dbContext.LessonVocabularies.Add(new Lumino.Api.Domain.Entities.LessonVocabulary
        {
            LessonId = 1,
            VocabularyItemId = 1
        });

        dbContext.UserVocabularies.Add(new Lumino.Api.Domain.Entities.UserVocabulary
        {
            Id = 1,
            UserId = 1,
            VocabularyItemId = 1,
            AddedAt = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc),
            NextReviewAt = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc),
            ReviewCount = 0
        });

        dbContext.SaveChanges();

        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc)), Options.Create(new LearningSettings()));

        service.UpdateWord(userId: 1, userVocabularyId: 1, new UpdateUserVocabularyRequest
        {
            Word = "run",
            Translation = "запускати",
            Definition = "Приватна дефініція"
        });

        Assert.Equal(2, dbContext.VocabularyItems.Count());

        var globalItem = dbContext.VocabularyItems.Single(x => x.Id == 1);
        Assert.Equal("бігти", globalItem.Translation);
        Assert.Equal("Глобальна дефініція", globalItem.Definition);

        var userVocabulary = dbContext.UserVocabularies.Single(x => x.Id == 1);
        Assert.NotEqual(1, userVocabulary.VocabularyItemId);

        var privateItem = dbContext.VocabularyItems.Single(x => x.Id == userVocabulary.VocabularyItemId);
        Assert.Equal("запускати", privateItem.Translation);
        Assert.Equal("Приватна дефініція", privateItem.Definition);
    }



    [Fact]
    public void AddWord_WhenAlreadyAdded_ShouldNotDuplicateUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "hello",
            Translation = "привіт"
        });

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "hello",
            Translation = "привіт"
        });

        Assert.Single(dbContext.VocabularyItems);
        Assert.Single(dbContext.UserVocabularies);
    }

    [Fact]
    public void GetDueVocabulary_AfterAdd_ShouldReturnWord()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "cat",
            Translation = "кіт"
        });

        var due = service.GetDueVocabulary(userId: 1);

        Assert.Single(due);
        Assert.Equal("cat", due[0].Word);
    }

    [Fact]
    public void ReviewWord_Correct_ShouldIncreaseReviewCount_AndSetNextReviewAt()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "dog",
            Translation = "пес"
        });

        var entity = dbContext.UserVocabularies.First();

        var response = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        Assert.Equal(1, response.ReviewCount);
        Assert.NotNull(response.LastReviewedAt);

        Assert.Equal(now, response.LastReviewedAt!.Value);
        Assert.Equal(now.AddDays(1), response.NextReviewAt);

        var due = service.GetDueVocabulary(userId: 1);
        Assert.Empty(due);
    }

    
    [Fact]
    public void ReviewWord_WithSameIdempotencyKey_ShouldBeIdempotent()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "fish",
            Translation = "риба"
        });

        var entity = dbContext.UserVocabularies.First();

        var first = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true,
            IdempotencyKey = "review-1"
        });

        var second = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true,
            IdempotencyKey = "review-1"
        });

        Assert.Equal(1, first.ReviewCount);
        Assert.Equal(1, second.ReviewCount);

        Assert.Equal(now, first.LastReviewedAt!.Value);
        Assert.Equal(now, second.LastReviewedAt!.Value);

        Assert.Equal(now.AddDays(1), first.NextReviewAt);
        Assert.Equal(now.AddDays(1), second.NextReviewAt);
    }


[Fact]
    public void ReviewWord_Wrong_ShouldResetReviewCount_AndSetNextReviewAt12h()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "bird",
            Translation = "птах"
        });

        var entity = dbContext.UserVocabularies.First();

        service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        var response = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = false
        });

        Assert.Equal(0, response.ReviewCount);
        Assert.NotNull(response.LastReviewedAt);

        Assert.Equal(now, response.LastReviewedAt!.Value);
        Assert.Equal(now.AddHours(12), response.NextReviewAt);
    }

    [Fact]
    public void ReviewWord_NotFound_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        Assert.Throws<KeyNotFoundException>(() =>
        {
            service.ReviewWord(userId: 1, userVocabularyId: 999, new ReviewVocabularyRequest
            {
                IsCorrect = true
            });
        });
    }

    [Fact]
    public void DeleteWord_NotFound_ShouldThrow()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        Assert.Throws<KeyNotFoundException>(() =>
        {
            service.DeleteWord(userId: 1, userVocabularyId: 999);
        });
    }

    [Fact]
    public void AddWord_ShouldSaveDesignerFields_ForUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "day",
            Translation = "день",
            Translations = new List<string> { "доба" },
            PartOfSpeech = "noun",
            Definition = "Один календарний день",
            Example = "Today is a sunny day",
            Examples = new List<string> { "Today is a sunny day", "Every day is different" },
            Synonyms = new List<string> { "morning", "afternoon" },
            Idioms = new List<string> { "every day", "one day" }
        });

        var item = dbContext.VocabularyItems.Single();

        Assert.Equal("day", item.Word);
        Assert.Equal("день", item.Translation);
        Assert.Equal("noun", item.PartOfSpeech);
        Assert.Equal("Один календарний день", item.Definition);
        Assert.Equal("Today is a sunny day", item.Example);
        Assert.False(string.IsNullOrWhiteSpace(item.ExamplesJson));
        Assert.False(string.IsNullOrWhiteSpace(item.SynonymsJson));
        Assert.False(string.IsNullOrWhiteSpace(item.IdiomsJson));

        var details = service.GetItemDetails(userId: 1, vocabularyItemId: item.Id);

        Assert.Equal(2, details.Translations.Count);
        Assert.Equal("день", details.Translations[0]);
        Assert.Equal("доба", details.Translations[1]);
        Assert.Equal("noun", details.PartOfSpeech);
        Assert.Equal("Один календарний день", details.Definition);
        Assert.Equal(2, details.Examples.Count);
        Assert.Equal(2, details.Synonyms.Count);
        Assert.Equal(2, details.Idioms.Count);
    }

    [Fact]
    public void LookupWord_AndUpdateWord_ShouldWork_ForUserVocabulary()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "day",
            Translation = "день",
            PartOfSpeech = "noun",
            Definition = "Стара дефініція",
            Example = "Today is a sunny day"
        });

        var lookup = service.LookupWord(userId: 1, word: "day");

        Assert.NotNull(lookup);
        Assert.Equal("day", lookup!.Word);
        Assert.Equal("день", lookup.Translation);

        var userVocabulary = dbContext.UserVocabularies.Single();

        service.UpdateWord(userId: 1, userVocabularyId: userVocabulary.Id, new UpdateUserVocabularyRequest
        {
            Word = "day",
            Translation = "день",
            Translations = new List<string> { "доба" },
            PartOfSpeech = "noun",
            Definition = "Нова дефініція",
            Example = "Today is a sunny day",
            Examples = new List<string> { "Today is a sunny day", "Every day is different" },
            Synonyms = new List<string> { "morning" },
            Idioms = new List<string> { "every day" }
        });

        var item = dbContext.VocabularyItems.Single();
        var details = service.GetItemDetails(userId: 1, vocabularyItemId: item.Id);

        Assert.Equal("Нова дефініція", details.Definition);
        Assert.Equal("noun", details.PartOfSpeech);
        Assert.Equal(2, details.Translations.Count);
        Assert.Equal("день", details.Translations[0]);
        Assert.Equal("доба", details.Translations[1]);
        Assert.Single(details.Synonyms);
        Assert.Single(details.Idioms);
    }


    [Fact]
    public void ScheduleReview_Today_ShouldSetNextReviewAtNow()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "day",
            Translation = "день"
        });

        var entity = dbContext.UserVocabularies.First();
        entity.NextReviewAt = now.AddDays(5);
        dbContext.SaveChanges();

        service.ScheduleReview(userId: 1, userVocabularyId: entity.Id, new ScheduleVocabularyReviewRequest
        {
            Period = "today"
        });

        var updated = dbContext.UserVocabularies.First();

        Assert.Equal(now, updated.NextReviewAt);
    }

    [Fact]
    public void ScheduleReview_Tomorrow_ShouldSetNextReviewAtTomorrow()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "night",
            Translation = "ніч"
        });

        var entity = dbContext.UserVocabularies.First();

        service.ScheduleReview(userId: 1, userVocabularyId: entity.Id, new ScheduleVocabularyReviewRequest
        {
            Period = "tomorrow"
        });

        var updated = dbContext.UserVocabularies.First();

        Assert.Equal(now.AddDays(1), updated.NextReviewAt);
    }

    [Fact]
    public void ScheduleReview_Days_ShouldSetNextReviewAtCustomDays()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "early",
            Translation = "рано"
        });

        var entity = dbContext.UserVocabularies.First();

        service.ScheduleReview(userId: 1, userVocabularyId: entity.Id, new ScheduleVocabularyReviewRequest
        {
            Period = "days",
            Days = 4
        });

        var updated = dbContext.UserVocabularies.First();

        Assert.Equal(now.AddDays(4), updated.NextReviewAt);
    }

    [Fact]
    public void ReviewWord_Correct_ShouldUseFixedIntervals_AndNotDependOnSettings()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var settings = new LearningSettings
        {
            VocabularyReviewIntervalsDays = new List<int> { 5, 9, 20 }
        };

        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(settings));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "home",
            Translation = "дім"
        });

        var entity = dbContext.UserVocabularies.First();

        var first = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        var second = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        Assert.Equal(1, first.ReviewCount);
        Assert.Equal(now.AddDays(1), first.NextReviewAt);

        Assert.Equal(2, second.ReviewCount);
        Assert.Equal(now.AddDays(2), second.NextReviewAt);
    }

    [Fact]
    public void ReviewWord_AfterMistakeWordWasAddedForToday_CorrectAnswersShouldGoTomorrowThenDays()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "wait",
            Translation = "чекати"
        });

        var entity = dbContext.UserVocabularies.First();
        entity.ReviewCount = 0;
        entity.NextReviewAt = now;
        dbContext.SaveChanges();

        var first = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        var second = service.ReviewWord(userId: 1, userVocabularyId: entity.Id, new ReviewVocabularyRequest
        {
            IsCorrect = true
        });

        Assert.Equal(now.AddDays(1), first.NextReviewAt);
        Assert.Equal(now.AddDays(2), second.NextReviewAt);
    }

    [Fact]
    public void DeleteWord_WhenPrivateItemBecomesUnused_ShouldRemoveIt()
    {
        var dbContext = TestDbContextFactory.Create();

        var now = new DateTime(2026, 2, 12, 10, 0, 0, DateTimeKind.Utc);
        var service = new VocabularyService(dbContext, new FixedDateTimeProvider(now), Options.Create(new LearningSettings()));

        service.AddWord(userId: 1, new AddVocabularyRequest
        {
            Word = "house",
            Translation = "будинок"
        });

        var userVocabulary = dbContext.UserVocabularies.Single();
        var vocabularyItemId = userVocabulary.VocabularyItemId;

        service.DeleteWord(userId: 1, userVocabularyId: userVocabulary.Id);

        Assert.Empty(dbContext.UserVocabularies);
        Assert.DoesNotContain(dbContext.VocabularyItems, x => x.Id == vocabularyItemId);
        Assert.DoesNotContain(dbContext.VocabularyItemTranslations, x => x.VocabularyItemId == vocabularyItemId);
    }
}
