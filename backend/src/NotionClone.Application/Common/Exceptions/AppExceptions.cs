namespace NotionClone.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"Entity \"{name}\" with key ({key}) was not found.") { }
}

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Unauthorized") : base(message) { }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Access denied") : base(message) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public ValidationException(string field, string error)
        : this(new Dictionary<string, string[]> { { field, new[] { error } } }) { }
}
