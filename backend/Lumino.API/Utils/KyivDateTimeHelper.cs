namespace Lumino.Api.Utils
{
    public static class KyivDateTimeHelper
    {
        private static readonly TimeZoneInfo KyivTimeZone = CreateKyivTimeZone();

        public static DateTime GetKyivNow(DateTime utcDateTime)
        {
            var safeUtc = EnsureUtc(utcDateTime);
            return TimeZoneInfo.ConvertTimeFromUtc(safeUtc, KyivTimeZone);
        }

        public static DateTime GetKyivDate(DateTime utcDateTime)
        {
            var kyivNow = GetKyivNow(utcDateTime);
            return new DateTime(kyivNow.Year, kyivNow.Month, kyivNow.Day, 0, 0, 0, DateTimeKind.Utc);
        }

        public static (DateTime startUtc, DateTime endUtc) GetUtcRangeForKyivDate(DateTime kyivDate)
        {
            var localStart = new DateTime(kyivDate.Year, kyivDate.Month, kyivDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var localEnd = localStart.AddDays(1);

            return (
                TimeZoneInfo.ConvertTimeToUtc(localStart, KyivTimeZone),
                TimeZoneInfo.ConvertTimeToUtc(localEnd, KyivTimeZone)
            );
        }

        public static (DateTime startUtc, DateTime endUtc) GetUtcRangeForKyivDateRange(DateTime kyivStartDate, DateTime kyivEndDateExclusive)
        {
            var localStart = new DateTime(kyivStartDate.Year, kyivStartDate.Month, kyivStartDate.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var localEnd = new DateTime(kyivEndDateExclusive.Year, kyivEndDateExclusive.Month, kyivEndDateExclusive.Day, 0, 0, 0, DateTimeKind.Unspecified);

            return (
                TimeZoneInfo.ConvertTimeToUtc(localStart, KyivTimeZone),
                TimeZoneInfo.ConvertTimeToUtc(localEnd, KyivTimeZone)
            );
        }

        private static DateTime EnsureUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        private static TimeZoneInfo CreateKyivTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Kyiv");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
            }
            catch (InvalidTimeZoneException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
            }
        }
    }
}
