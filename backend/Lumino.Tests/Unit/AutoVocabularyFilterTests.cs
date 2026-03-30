using Lumino.Api.Utils;
using Xunit;

namespace Lumino.Tests;

public class AutoVocabularyFilterTests
{
    [Theory]
    [InlineData("cat")]
    [InlineData("doesn't")]
    [InlineData("Yes")]
    [InlineData("thank you")]
    public void ShouldAutoAdd_ReturnsTrue_ForShortVocabularyItems(string value)
    {
        Assert.True(AutoVocabularyFilter.ShouldAutoAdd(value));
    }

    [Theory]
    [InlineData("yes, he does")]
    [InlineData("does she sleep?")]
    [InlineData("так, я читаю")]
    public void ShouldAutoAdd_ReturnsFalse_ForPhrases(string value)
    {
        Assert.False(AutoVocabularyFilter.ShouldAutoAdd(value));
    }
}
