using Lumino.Api.Application.DTOs;
using Lumino.Api.Application.Services;
using Lumino.Api.Domain.Entities;
using Lumino.Api.Utils;
using Microsoft.Extensions.Options;
using Xunit;

namespace Lumino.Tests.Integration;

public class SceneRewardsIntegrityIntegrationTests
{
    [Fact]
    public void SubmitScene_ThenFixMistakes_ShouldCompleteSceneAndAwardSceneCrystalsOnlyOnce()
    {
        var now = new DateTime(2026, 03, 27, 12, 0, 0, DateTimeKind.Utc);

        var dbContext = TestDbContextFactory.Create();
        var dateTimeProvider = new FixedDateTimeProvider(now);
        var economy = new FakeUserEconomyService();

        dbContext.Courses.Add(new Course
        {
            Id = 1,
            Title = "Course",
            Description = "Desc",
            IsPublished = true
        });

        dbContext.Scenes.Add(new Scene
        {
            Id = 1,
            CourseId = 1,
            Order = 1,
            Title = "Scene 1",
            Description = "",
            SceneType = "Quiz"
        });

        dbContext.SceneSteps.AddRange(
            new SceneStep
            {
                Id = 1,
                SceneId = 1,
                Order = 1,
                Speaker = "NPC",
                Text = "Pick A",
                StepType = "Choice",
                ChoicesJson = "[{\"text\":\"A\",\"isCorrect\":true},{\"text\":\"B\",\"isCorrect\":false}]"
            },
            new SceneStep
            {
                Id = 2,
                SceneId = 1,
                Order = 2,
                Speaker = "NPC",
                Text = "Pick C",
                StepType = "Choice",
                ChoicesJson = "[{\"text\":\"C\",\"isCorrect\":true},{\"text\":\"D\",\"isCorrect\":false}]"
            }
        );

        dbContext.SaveChanges();

        var settings = Options.Create(new LearningSettings
        {
            PassingScorePercent = 80,
            SceneUnlockEveryLessons = 1,
            SceneCompletionScore = 15,
            CrystalsRewardPerCompletedScene = 15
        });

        var service = new SceneService(
            dbContext,
            dateTimeProvider,
            new FakeAchievementService(),
            economy,
            settings
        );

        var firstAttempt = service.SubmitScene(10, 1, new SubmitSceneRequest
        {
            Answers = new List<SubmitSceneAnswerRequest>
            {
                new SubmitSceneAnswerRequest { StepId = 1, Answer = "B" },
                new SubmitSceneAnswerRequest { StepId = 2, Answer = "C" }
            }
        });

        Assert.False(firstAttempt.IsCompleted);
        Assert.Equal(0, economy.AwardCompletedSceneCrystalsCallsCount);

        var fixedAttempt = service.SubmitSceneMistakes(10, 1, new SubmitSceneRequest
        {
            Answers = new List<SubmitSceneAnswerRequest>
            {
                new SubmitSceneAnswerRequest { StepId = 1, Answer = "A" }
            }
        });

        Assert.True(fixedAttempt.IsCompleted);
        Assert.Equal(1, economy.AwardCompletedSceneCrystalsCallsCount);

        var repeatedAttempt = service.SubmitScene(10, 1, new SubmitSceneRequest
        {
            Answers = new List<SubmitSceneAnswerRequest>
            {
                new SubmitSceneAnswerRequest { StepId = 1, Answer = "A" },
                new SubmitSceneAnswerRequest { StepId = 2, Answer = "C" }
            }
        });

        Assert.True(repeatedAttempt.IsCompleted);
        Assert.Equal(1, economy.AwardCompletedSceneCrystalsCallsCount);

        var attempt = dbContext.SceneAttempts.First(x => x.UserId == 10 && x.SceneId == 1);
        Assert.True(attempt.IsCompleted);
        Assert.Equal(2, attempt.Score);
        Assert.Equal(2, attempt.TotalQuestions);
    }
}
