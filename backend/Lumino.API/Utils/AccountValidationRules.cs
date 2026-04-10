using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace Lumino.Api.Utils
{
    public static class AccountValidationRules
    {
        public const int UsernameMinLength = 3;
        public const int UsernameMaxLength = 32;
        public const int EmailMinLength = 5;
        public const int EmailMaxLength = 256;
        public const int LegacyPasswordMinLength = 6;
        public const int PasswordMinLength = 8;
        public const int PasswordMaxLength = 64;

        private static readonly Regex UsernameAllowedRegex = new(
            @"^[\p{L}\p{M}\d](?:[\p{L}\p{M}\d ._-]*[\p{L}\p{M}\d])?$",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public static void ValidateUsername(string? username, bool required = false, string fieldName = "Username")
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                if (required)
                {
                    throw new ArgumentException($"{fieldName} is required");
                }

                return;
            }

            var value = username.Trim();

            if (value.Length < UsernameMinLength || value.Length > UsernameMaxLength)
            {
                throw new ArgumentException($"{fieldName} length must be between {UsernameMinLength} and {UsernameMaxLength} characters");
            }

            if (!value.Any(char.IsLetter))
            {
                throw new ArgumentException($"{fieldName} must contain at least one letter");
            }

            if (!UsernameAllowedRegex.IsMatch(value))
            {
                throw new ArgumentException($"{fieldName} may contain only letters, digits, spaces, dots, underscores, and hyphens");
            }

            if (value.Contains("  "))
            {
                throw new ArgumentException($"{fieldName} must not contain consecutive spaces");
            }
        }

        public static void ValidateLoginUsername(string username, string fieldName = "Username")
        {
            var value = string.IsNullOrWhiteSpace(username) ? string.Empty : username.Trim();

            if (value.Length < UsernameMinLength || value.Length > UsernameMaxLength)
            {
                throw new ArgumentException($"{fieldName} length must be between {UsernameMinLength} and {UsernameMaxLength} characters");
            }
        }

        public static void ValidateEmail(string? email, bool required = true, string fieldName = "Email")
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                if (required)
                {
                    throw new ArgumentException($"{fieldName} is required");
                }

                return;
            }

            var value = email.Trim();

            if (value.Length < EmailMinLength || value.Length > EmailMaxLength)
            {
                throw new ArgumentException($"{fieldName} length must be between {EmailMinLength} and {EmailMaxLength} characters");
            }

            if (value.Contains(' '))
            {
                throw new ArgumentException($"{fieldName} is invalid");
            }

            try
            {
                var parsed = new MailAddress(value);

                if (!string.Equals(parsed.Address, value, StringComparison.Ordinal) || string.IsNullOrWhiteSpace(parsed.Host) || !parsed.Host.Contains('.'))
                {
                    throw new ArgumentException($"{fieldName} is invalid");
                }
            }
            catch (FormatException)
            {
                throw new ArgumentException($"{fieldName} is invalid");
            }
        }

        public static void ValidatePasswordForSet(string? password, bool required = true, string fieldName = "Password")
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                if (required)
                {
                    throw new ArgumentException($"{fieldName} is required");
                }

                return;
            }

            var value = password;

            if (value.Length < PasswordMinLength)
            {
                throw new ArgumentException($"{fieldName} must be at least {PasswordMinLength} characters");
            }

            if (value.Length > PasswordMaxLength)
            {
                throw new ArgumentException($"{fieldName} must be at most {PasswordMaxLength} characters");
            }

            if (!value.Any(char.IsLetter))
            {
                throw new ArgumentException($"{fieldName} must contain at least one letter");
            }

            if (!value.Any(char.IsDigit))
            {
                throw new ArgumentException($"{fieldName} must contain at least one digit");
            }
        }

        public static void ValidatePasswordForLogin(string? password, bool required = true, string fieldName = "Password")
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                if (required)
                {
                    throw new ArgumentException($"{fieldName} is required");
                }

                return;
            }

            var value = password;

            if (value.Length < LegacyPasswordMinLength)
            {
                throw new ArgumentException($"{fieldName} must be at least {LegacyPasswordMinLength} characters");
            }

            if (value.Length > PasswordMaxLength)
            {
                throw new ArgumentException($"{fieldName} must be at most {PasswordMaxLength} characters");
            }
        }

        public static string BuildUsernameCandidate(string? value, string fallback = "user")
        {
            var source = string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

            if (string.IsNullOrWhiteSpace(source))
            {
                return fallback;
            }

            var buffer = new StringBuilder();
            var previousWasSpace = false;

            foreach (var ch in source)
            {
                if (char.IsLetterOrDigit(ch) || ch == '.' || ch == '_' || ch == '-')
                {
                    buffer.Append(ch);
                    previousWasSpace = false;
                    continue;
                }

                if (char.IsWhiteSpace(ch))
                {
                    if (!previousWasSpace)
                    {
                        buffer.Append(' ');
                        previousWasSpace = true;
                    }
                }
            }

            var candidate = buffer.ToString().Trim(' ', '.', '_', '-');

            if (candidate.Length > UsernameMaxLength)
            {
                candidate = candidate.Substring(0, UsernameMaxLength).Trim(' ', '.', '_', '-');
            }

            if (candidate.Length < UsernameMinLength || !candidate.Any(char.IsLetter))
            {
                candidate = fallback;
            }

            if (candidate.Length > UsernameMaxLength)
            {
                candidate = candidate.Substring(0, UsernameMaxLength).Trim(' ', '.', '_', '-');
            }

            if (candidate.Length < UsernameMinLength)
            {
                candidate = fallback.PadRight(UsernameMinLength, 'r');
            }

            return candidate;
        }

        public static string BuildUsernameFromEmail(string emailLocalPart, string fallback = "user")
        {
            return BuildUsernameCandidate(emailLocalPart, fallback);
        }
    }
}
