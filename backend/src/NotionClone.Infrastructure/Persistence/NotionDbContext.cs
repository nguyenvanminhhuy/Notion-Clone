using Microsoft.EntityFrameworkCore;
using NotionClone.Domain.Entities;

namespace NotionClone.Infrastructure.Persistence;

public class NotionDbContext : DbContext
{
    public NotionDbContext(DbContextOptions<NotionDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<PageVersion> PageVersions => Set<PageVersion>();
    public DbSet<PageShare> PageShares => Set<PageShare>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
    public DbSet<AIConversation> AIConversations => Set<AIConversation>();
    public DbSet<AIMessage> AIMessages => Set<AIMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User & Settings (1:1)
        modelBuilder.Entity<User>(builder =>
        {
            builder.HasIndex(u => u.Email).IsUnique();
            builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
            builder.Property(u => u.Name).HasMaxLength(100).IsRequired();

            builder.HasOne(u => u.Settings)
                   .WithOne(s => s.User)
                   .HasForeignKey<UserSettings>(s => s.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // Workspace & WorkspaceMember
        modelBuilder.Entity<Workspace>(builder =>
        {
            builder.HasIndex(w => w.Slug).IsUnique();
            builder.Property(w => w.Name).HasMaxLength(150).IsRequired();
        });

        modelBuilder.Entity<WorkspaceMember>(builder =>
        {
            builder.HasIndex(wm => new { wm.WorkspaceId, wm.UserId }).IsUnique();

            builder.HasOne(wm => wm.Workspace)
                   .WithMany(w => w.Members)
                   .HasForeignKey(wm => wm.WorkspaceId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(wm => wm.User)
                   .WithMany(u => u.WorkspaceMemberships)
                   .HasForeignKey(wm => wm.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // Page Entity & Hierarchy
        modelBuilder.Entity<Page>(builder =>
        {
            builder.HasIndex(p => p.WorkspaceId);
            builder.HasIndex(p => p.ParentId);
            builder.HasIndex(p => p.IsArchived);
            builder.HasIndex(p => p.IsFavorite);

            builder.Property(p => p.Title).HasMaxLength(255).IsRequired();
            builder.Property(p => p.Content).HasColumnType("jsonb");

            // Self-referential hierarchy
            builder.HasOne(p => p.ParentPage)
                   .WithMany(p => p.ChildPages)
                   .HasForeignKey(p => p.ParentId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.Workspace)
                   .WithMany(w => w.Pages)
                   .HasForeignKey(p => p.WorkspaceId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.CreatedBy)
                   .WithMany()
                   .HasForeignKey(p => p.CreatedById)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.LastEditedBy)
                   .WithMany()
                   .HasForeignKey(p => p.LastEditedById)
                   .OnDelete(DeleteBehavior.Restrict);
        });

        // PageVersion
        modelBuilder.Entity<PageVersion>(builder =>
        {
            builder.HasOne(pv => pv.Page)
                   .WithMany(p => p.Versions)
                   .HasForeignKey(pv => pv.PageId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pv => pv.EditedBy)
                   .WithMany()
                   .HasForeignKey(pv => pv.EditedById)
                   .OnDelete(DeleteBehavior.Restrict);
        });

        // PageShare
        modelBuilder.Entity<PageShare>(builder =>
        {
            builder.HasOne(ps => ps.Page)
                   .WithMany(p => p.Shares)
                   .HasForeignKey(ps => ps.PageId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ps => ps.User)
                   .WithMany()
                   .HasForeignKey(ps => ps.UserId)
                   .OnDelete(DeleteBehavior.SetNull);
        });

        // Comment Entity
        modelBuilder.Entity<Comment>(builder =>
        {
            builder.HasIndex(c => c.PageId);

            builder.HasOne(c => c.Page)
                   .WithMany(p => p.Comments)
                   .HasForeignKey(c => c.PageId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(c => c.User)
                   .WithMany()
                   .HasForeignKey(c => c.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.ParentComment)
                   .WithMany(c => c.Replies)
                   .HasForeignKey(c => c.ParentId)
                   .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification Entity
        modelBuilder.Entity<Notification>(builder =>
        {
            builder.HasIndex(n => n.UserId);
            builder.HasIndex(n => n.IsRead);

            builder.HasOne(n => n.User)
                   .WithMany(u => u.Notifications)
                   .HasForeignKey(n => n.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        // FileAttachment Entity
        modelBuilder.Entity<FileAttachment>(builder =>
        {
            builder.HasOne(f => f.Page)
                   .WithMany(p => p.Attachments)
                   .HasForeignKey(f => f.PageId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(f => f.UploadedBy)
                   .WithMany()
                   .HasForeignKey(f => f.UploadedById)
                   .OnDelete(DeleteBehavior.Restrict);
        });

        // AI Conversations & Messages
        modelBuilder.Entity<AIConversation>(builder =>
        {
            builder.HasOne(c => c.User)
                   .WithMany()
                   .HasForeignKey(c => c.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(c => c.Page)
                   .WithMany()
                   .HasForeignKey(c => c.PageId)
                   .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AIMessage>(builder =>
        {
            builder.HasOne(m => m.Conversation)
                   .WithMany(c => c.Messages)
                   .HasForeignKey(m => m.ConversationId)
                   .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
