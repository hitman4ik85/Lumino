using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Xunit;

namespace Lumino.Tests;

public class AdminVocabularyServiceTests
{
    [Fact]
    public void Create_AddsItemWithTranslations()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var created = service.Create(new CreateVocabularyItemRequest
        {
            Word = "cat",
            Example = "A cat",
            Translations = new() { "кіт", "котик", "кіт" }
        });

        Assert.True(created.Id > 0);
        Assert.Equal("cat", created.Word);
        Assert.Equal(2, created.Translations.Count);

        var savedItem = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == created.Id);
        Assert.NotNull(savedItem);

        var savedTranslations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == created.Id)
            .OrderBy(x => x.Order)
            .ToList();

        Assert.Equal(2, savedTranslations.Count);
        Assert.Equal("кіт", savedTranslations[0].Translation);
        Assert.Equal("котик", savedTranslations[1].Translation);
    }

    [Fact]
    public void Update_ReplacesTranslations()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var created = service.Create(new CreateVocabularyItemRequest
        {
            Word = "dog",
            Example = "A dog",
            Translations = new() { "пес", "собака" }
        });

        service.Update(created.Id, new UpdateVocabularyItemRequest
        {
            Word = "dog",
            Example = "A dog!",
            Translations = new() { "песик" }
        });

        var updated = service.GetById(created.Id);

        Assert.Equal("dog", updated.Word);
        Assert.Equal("A dog!", updated.Example);
        Assert.Single(updated.Translations);
        Assert.Equal("песик", updated.Translations[0]);
    }

    [Fact]
    public void LinkAndUnlink_LessonVocabulary_Works()
    {
        var dbContext = TestDbContextFactory.Create();

        var topic = new Topic { CourseId = 1, Title = "Topic", Order = 1 };
        dbContext.Topics.Add(topic);
        dbContext.SaveChanges();

        var lesson = new Lesson { TopicId = topic.Id, Title = "L1", Theory = "T1", Order = 1 };
        dbContext.Lessons.Add(lesson);
        dbContext.SaveChanges();

        var vocab = new VocabularyItem { Word = "tree", Translation = "дерево", Example = "tree" };
        dbContext.VocabularyItems.Add(vocab);
        dbContext.SaveChanges();

        var service = new AdminVocabularyService(dbContext);

        service.LinkToLesson(lesson.Id, vocab.Id);

        var list = service.GetByLesson(lesson.Id);

        Assert.Single(list);
        Assert.Equal(vocab.Id, list[0].Id);

        service.UnlinkFromLesson(lesson.Id, vocab.Id);

        var list2 = service.GetByLesson(lesson.Id);

        Assert.Empty(list2);
    }

    [Fact]
    public void Delete_RemovesItemAndTranslations()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var created = service.Create(new CreateVocabularyItemRequest
        {
            Word = "bird",
            Example = "A bird",
            Translations = new() { "птах" }
        });

        service.Delete(created.Id);

        Assert.False(dbContext.VocabularyItems.Any(x => x.Id == created.Id));
        Assert.False(dbContext.VocabularyItemTranslations.Any(x => x.VocabularyItemId == created.Id));
    }
}
