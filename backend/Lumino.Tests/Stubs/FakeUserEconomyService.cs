using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Interfaces;

namespace Lumino.Tests;

public class FakeUserEconomyService : IUserEconomyService
{
    public int AwardHeartForPracticeCallsCount { get; private set; }

    public int ConsumeHeartsForMistakesCallsCount { get; private set; }

    public int LastConsumedMistakesCount { get; private set; }

    public int AwardCrystalsCallsCount { get; private set; }

    public int AwardCompletedSceneCrystalsCallsCount { get; private set; }

    public int LastAwardedCrystalsAmount { get; private set; }

    public void EnsureHasHeartsOrThrow(int userId)
    {
    }

    public void RefreshHearts(int userId)
    {
    }

    public void ConsumeHeartsForMistakes(int userId, int mistakesCount)
    {
        ConsumeHeartsForMistakesCallsCount++;
        LastConsumedMistakesCount = mistakesCount;
    }

    public void AwardCrystals(int userId, int amount)
    {
        AwardCrystalsCallsCount++;
        LastAwardedCrystalsAmount = amount;
    }

    public void AwardCrystalsForPassedLessonIfNeeded(int userId)
    {
    }

    public void AwardCrystalsForCompletedSceneIfNeeded(int userId)
    {
        AwardCompletedSceneCrystalsCallsCount++;
    }

    public void AwardHeartForPracticeIfPossible(int userId)
    {
        AwardHeartForPracticeCallsCount++;
    }

    public RestoreHeartsResponse RestoreHearts(int userId, RestoreHeartsRequest request)
    {
        return new RestoreHeartsResponse
        {
            Hearts = 0,
            Crystals = 0
        };
    }
}
