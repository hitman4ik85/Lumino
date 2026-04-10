using System.Net;
using Microsoft.EntityFrameworkCore;

namespace Lumino.Api.Utils
{
    public static class DbUpdateExceptionMapper
    {
        public static bool TryMap(DbUpdateException ex, out int statusCode, out string type, out string message)
        {
            var fullMessage = BuildMessage(ex).ToLowerInvariant();

            statusCode = (int)HttpStatusCode.InternalServerError;
            type = "server_error";
            message = "Unexpected server error.";

            if (string.IsNullOrWhiteSpace(fullMessage))
            {
                return false;
            }

            if (ContainsAny(fullMessage, "ix_scenes_courseid_order", "ux_scenes_courseid_order"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Scene with this Order already exists in this course";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_topics_courseid_order", "ux_topics_courseid_order"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Order is already used in this course";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_lessons_topicid_order", "ux_lessons_topicid_order"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Order is already used in this topic";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_scenesteps_sceneid_order", "ux_scenesteps_sceneid_order"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Step with this Order already exists";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_vocabularyitemtranslations_vocabularyitemid_translation", "ux_vocabularyitemtranslations_vocabularyitemid_translation"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Translation is already added for this word";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_users_email", "users.email"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "User with this email already exists";
                return true;
            }

            if (ContainsAny(fullMessage, "ix_users_username", "users.username"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "User with this username already exists";
                return true;
            }

            if (ContainsAny(fullMessage, "fk_courses_courses_prerequisitecourseid"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "Course cannot be deleted while it is selected as a prerequisite by another course";
                return true;
            }

            if (ContainsAny(fullMessage, "reference constraint", "foreign key constraint", "foreign key conflict", "the delete statement conflicted"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "This item cannot be deleted or updated because it is still used by related data";
                return true;
            }

            if (ContainsAny(fullMessage, "duplicate key", "unique constraint failed", "cannot insert duplicate key row", "duplicate entry", "unique index"))
            {
                statusCode = (int)HttpStatusCode.Conflict;
                type = "conflict";
                message = "This value is already used by another item";
                return true;
            }

            return false;
        }

        private static string BuildMessage(Exception? ex)
        {
            var parts = new List<string>();
            var current = ex;

            while (current != null)
            {
                if (!string.IsNullOrWhiteSpace(current.Message))
                {
                    parts.Add(current.Message);
                }

                current = current.InnerException;
            }

            return string.Join(" | ", parts);
        }

        private static bool ContainsAny(string source, params string[] fragments)
        {
            foreach (var fragment in fragments)
            {
                if (!string.IsNullOrWhiteSpace(fragment) && source.Contains(fragment, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
