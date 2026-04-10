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
    public void Update_UpdatesDictionaryFields()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var created = service.Create(new CreateVocabularyItemRequest
        {
            Word = "house",
            Example = "A house",
            Translations = new() { "будинок" },
            PartOfSpeech = "noun",
            Definition = "A building where people live",
            Transcription = "/haʊs/",
            Gender = "none",
            Examples = new() { "This house is big." },
            Synonyms = new()
            {
                new VocabularyRelationDto { Word = "home", Translation = "дім" }
            },
            Idioms = new()
            {
                new VocabularyRelationDto { Word = "bring the house down", Translation = "зірвати оплески" }
            }
        });

        service.Update(created.Id, new UpdateVocabularyItemRequest
        {
            Word = "house",
            Example = "A house!",
            Translations = new() { "будинок", "хата" },
            PartOfSpeech = "noun",
            Definition = "A place where people live",
            Transcription = "/haʊs/",
            Gender = "none",
            Examples = new() { "This house is small.", "This is my house." },
            Synonyms = new()
            {
                new VocabularyRelationDto { Word = "home", Translation = "дім" },
                new VocabularyRelationDto { Word = "dwelling", Translation = "житло" }
            },
            Idioms = new()
            {
                new VocabularyRelationDto { Word = "on the house", Translation = "за рахунок закладу" }
            }
        });

        var updated = service.GetById(created.Id);

        Assert.Equal("house", updated.Word);
        Assert.Equal("A house!", updated.Example);
        Assert.Equal(2, updated.Translations.Count);
        Assert.Equal("будинок", updated.Translations[0]);
        Assert.Equal("хата", updated.Translations[1]);

        Assert.Equal("noun", updated.PartOfSpeech);
        Assert.Equal("A place where people live", updated.Definition);
        Assert.Equal("/haʊs/", updated.Transcription);
        Assert.Equal("none", updated.Gender);

        Assert.Equal(2, updated.Examples.Count);
        Assert.Equal("This house is small.", updated.Examples[0]);
        Assert.Equal("This is my house.", updated.Examples[1]);

        Assert.Equal(2, updated.Synonyms.Count);
        Assert.Equal("home", updated.Synonyms[0].Word);
        Assert.Equal("dwelling", updated.Synonyms[1].Word);

        Assert.Single(updated.Idioms);
        Assert.Equal("on the house", updated.Idioms[0].Word);

        var savedItem = dbContext.VocabularyItems.FirstOrDefault(x => x.Id == created.Id);
        Assert.NotNull(savedItem);
        Assert.False(string.IsNullOrWhiteSpace(savedItem!.ExamplesJson));
        Assert.False(string.IsNullOrWhiteSpace(savedItem.SynonymsJson));
        Assert.False(string.IsNullOrWhiteSpace(savedItem.IdiomsJson));
    }

    [Fact]
    public void GetByCourseLanguage_ReturnsUniqueSortedWordsForSameLanguage()
    {
        var dbContext = TestDbContextFactory.Create();

        var courseEnA1 = new Course { Title = "English A1", Description = "A1", LanguageCode = "en", Level = "A1", Order = 1 };
        var courseEnA2 = new Course { Title = "English A2", Description = "A2", LanguageCode = "en", Level = "A2", Order = 2 };
        var courseDeA1 = new Course { Title = "Deutsch A1", Description = "A1", LanguageCode = "de", Level = "A1", Order = 3 };
        dbContext.Courses.AddRange(courseEnA1, courseEnA2, courseDeA1);
        dbContext.SaveChanges();

        var topicEnA1 = new Topic { CourseId = courseEnA1.Id, Title = "Topic 1", Order = 1 };
        var topicEnA2 = new Topic { CourseId = courseEnA2.Id, Title = "Topic 2", Order = 1 };
        var topicDeA1 = new Topic { CourseId = courseDeA1.Id, Title = "Thema 1", Order = 1 };
        dbContext.Topics.AddRange(topicEnA1, topicEnA2, topicDeA1);
        dbContext.SaveChanges();

        var lessonEnA1 = new Lesson { TopicId = topicEnA1.Id, Title = "Lesson 1", Theory = "Theory", Order = 1 };
        var lessonEnA2 = new Lesson { TopicId = topicEnA2.Id, Title = "Lesson 2", Theory = "Theory", Order = 1 };
        var lessonDeA1 = new Lesson { TopicId = topicDeA1.Id, Title = "Lektion 1", Theory = "Theorie", Order = 1 };
        dbContext.Lessons.AddRange(lessonEnA1, lessonEnA2, lessonDeA1);
        dbContext.SaveChanges();

        var zebra = new VocabularyItem { Word = "zebra", Translation = "зебра", Example = "zebra" };
        var apple = new VocabularyItem { Word = "apple", Translation = "яблуко", Example = "apple" };
        var haus = new VocabularyItem { Word = "haus", Translation = "будинок", Example = "haus" };
        dbContext.VocabularyItems.AddRange(zebra, apple, haus);
        dbContext.SaveChanges();

        dbContext.VocabularyItemTranslations.AddRange(
            new VocabularyItemTranslation { VocabularyItemId = zebra.Id, Translation = "зебра", Order = 1 },
            new VocabularyItemTranslation { VocabularyItemId = apple.Id, Translation = "яблуко", Order = 1 },
            new VocabularyItemTranslation { VocabularyItemId = haus.Id, Translation = "будинок", Order = 1 }
        );
        dbContext.SaveChanges();

        dbContext.LessonVocabularies.AddRange(
            new LessonVocabulary { LessonId = lessonEnA1.Id, VocabularyItemId = zebra.Id },
            new LessonVocabulary { LessonId = lessonEnA1.Id, VocabularyItemId = apple.Id },
            new LessonVocabulary { LessonId = lessonEnA2.Id, VocabularyItemId = zebra.Id },
            new LessonVocabulary { LessonId = lessonDeA1.Id, VocabularyItemId = haus.Id }
        );
        dbContext.SaveChanges();

        var service = new AdminVocabularyService(dbContext);

        var result = service.GetByCourseLanguage(courseEnA1.Id);

        Assert.Equal(2, result.Count);
        Assert.Equal("apple", result[0].Word);
        Assert.Equal("zebra", result[1].Word);
        Assert.DoesNotContain(result, item => item.Word == "haus");
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
    public void Export_ReturnsOnlySelectedItems()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var cat = service.Create(new CreateVocabularyItemRequest
        {
            Word = "cat",
            Example = "A cat",
            Translations = new() { "кіт" }
        });

        var dog = service.Create(new CreateVocabularyItemRequest
        {
            Word = "dog",
            Example = "A dog",
            Translations = new() { "пес" }
        });

        var exported = service.Export(new AdminVocabularyExportRequest
        {
            Ids = new() { dog.Id }
        });

        Assert.Single(exported.Items);
        Assert.Equal("dog", exported.Items[0].Word);
        Assert.Equal("пес", exported.Items[0].Translations[0]);
    }

    [Fact]
    public void Import_MergesMissingFieldsWithoutCreatingDuplicates()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var created = service.Create(new CreateVocabularyItemRequest
        {
            Word = "apple",
            Example = "",
            Translations = new() { "яблуко" },
            Definition = "",
            Examples = new()
        });

        var imported = service.Import(new AdminVocabularyImportRequest
        {
            Items = new()
            {
                new CreateVocabularyItemRequest
                {
                    Word = "apple",
                    Example = "I eat an apple.",
                    Translations = new() { "яблуко", "яблучко" },
                    Definition = "round fruit",
                    Examples = new() { "I eat an apple." },
                    Synonyms = new()
                    {
                        new VocabularyRelationDto { Word = "fruit", Translation = "фрукт" }
                    }
                }
            }
        });

        Assert.Equal(0, imported.CreatedCount);
        Assert.Equal(1, imported.UpdatedCount);
        Assert.Equal(1, dbContext.VocabularyItems.Count());

        var updated = service.GetById(created.Id);
        Assert.Equal("I eat an apple.", updated.Example);
        Assert.Equal("round fruit", updated.Definition);
        Assert.Equal(2, updated.Translations.Count);
        Assert.Equal("яблуко", updated.Translations[0]);
        Assert.Equal("яблучко", updated.Translations[1]);
        Assert.Single(updated.Synonyms);
        Assert.Equal("fruit", updated.Synonyms[0].Word);
    }

    [Fact]
    public void Import_SplitsSlashPairsIntoSeparateWords()
    {
        var dbContext = TestDbContextFactory.Create();
        var service = new AdminVocabularyService(dbContext);

        var imported = service.Import(new AdminVocabularyImportRequest
        {
            Items = new()
            {
                new CreateVocabularyItemRequest
                {
                    Word = "cheap/expensive",
                    Translations = new() { "дешево/дорого" }
                }
            }
        });

        Assert.Equal(2, imported.CreatedCount);
        Assert.Equal(2, dbContext.VocabularyItems.Count());
        Assert.Contains(dbContext.VocabularyItems, x => x.Word == "cheap" && x.Translation == "дешево");
        Assert.Contains(dbContext.VocabularyItems, x => x.Word == "expensive" && x.Translation == "дорого");
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
