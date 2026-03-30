namespace Lumino.Api.Application.DTOs
{
    public class StreakCalendarDayResponse
    {
        public DateTime DateUtc { get; set; }

        public bool IsActive { get; set; }

        public bool IsRegistrationDay { get; set; }
    }

    public class StreakCalendarResponse
    {
        public int Year { get; set; }

        public int Month { get; set; }

        public DateTime? RegisteredAtUtc { get; set; }

        public int DaysSinceJoined { get; set; }

        public string CurrentKyivDateTimeText { get; set; } = string.Empty;

        public List<StreakCalendarDayResponse> Days { get; set; } = new();
    }
}
