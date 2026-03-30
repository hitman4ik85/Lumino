using Lumino.Api.Application.DTOs;
using Lumino.Api.Data;
using Lumino.Api.Data.Seeder;
using System.Reflection;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests;

public class LuminoSeederVocabularyFieldsTests
{
    [Fact]
    public void SeedVocabulary_ShouldFillVocabularyFields_InFrontendFormat()
    {
        var dbContext = TestDbContextFactory.Create();

        InvokePrivateSeedVocabulary(dbContext);

        var dayWords = dbContext.VocabularyItems.ToList();

        Assert.Equal(VocabularySeederData.GetItems().Count, dayWords.Count);
        Assert.All(dayWords, item =>
        {
            Assert.False(string.IsNullOrWhiteSpace(item.PartOfSpeech));
            Assert.False(string.IsNullOrWhiteSpace(item.Definition));
            Assert.False(string.IsNullOrWhiteSpace(item.Example));
            Assert.False(string.IsNullOrWhiteSpace(item.ExamplesJson));
            Assert.False(string.IsNullOrWhiteSpace(item.SynonymsJson));
            Assert.False(string.IsNullOrWhiteSpace(item.IdiomsJson));

            var examples = JsonSerializer.Deserialize<List<string>>(item.ExamplesJson!);
            var synonyms = JsonSerializer.Deserialize<List<VocabularyRelationDto>>(item.SynonymsJson!);
            var idioms = JsonSerializer.Deserialize<List<VocabularyRelationDto>>(item.IdiomsJson!);

            Assert.NotNull(examples);
            Assert.NotEmpty(examples!);
            Assert.NotNull(synonyms);
            Assert.NotEmpty(synonyms!);
            Assert.NotNull(idioms);
            Assert.NotEmpty(idioms!);
        });

        var hello = dbContext.VocabularyItems.First(x => x.Word == "hello");
        Assert.Equal("фраза", hello.PartOfSpeech);
        Assert.Equal("Уживана фраза для привітання під час зустрічі.", hello.Definition);

        var helloSynonyms = JsonSerializer.Deserialize<List<VocabularyRelationDto>>(hello.SynonymsJson!);
        Assert.Contains(helloSynonyms!, x => x.Word == "hi" && x.Translation == "привіт");

        var time = dbContext.VocabularyItems.First(x => x.Word == "time");
        Assert.Equal("іменник", time.PartOfSpeech);

        var timeIdioms = JsonSerializer.Deserialize<List<VocabularyRelationDto>>(time.IdiomsJson!);
        Assert.Contains(timeIdioms!, x => x.Word == "on time" && x.Translation == "вчасно");
    }

    [Fact]
    public void SeedVocabulary_ShouldSplitBaseTranslationAndApplyExtraTranslations()
    {
        var dbContext = TestDbContextFactory.Create();

        InvokePrivateSeedVocabulary(dbContext);

        var goodMorning = dbContext.VocabularyItems.First(x => x.Word == "good morning");
        var goodMorningTranslations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == goodMorning.Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Contains("доброго ранку", goodMorningTranslations);
        Assert.Contains("добрий ранок", goodMorningTranslations);

        var room = dbContext.VocabularyItems.First(x => x.Word == "room");
        var roomTranslations = dbContext.VocabularyItemTranslations
            .Where(x => x.VocabularyItemId == room.Id)
            .OrderBy(x => x.Order)
            .Select(x => x.Translation)
            .ToList();

        Assert.Contains("кімната", roomTranslations);
        Assert.Contains("номер", roomTranslations);
    }

    private static void InvokePrivateSeedVocabulary(LuminoDbContext dbContext)
    {
        var method = typeof(LuminoSeeder).GetMethod(
            "SeedVocabulary",
            BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(method);

        method!.Invoke(null, new object[] { dbContext });
    }
}
