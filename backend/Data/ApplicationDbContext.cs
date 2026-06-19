using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<MatchHistory> MatchHistories => Set<MatchHistory>();
    public DbSet<Ship> Ships => Set<Ship>();
    public DbSet<Attack> Attacks => Set<Attack>();
    protected override void OnModelCreating(
    ModelBuilder builder)
    {
        builder.Entity<Game>()
            .HasOne(g => g.Host)
            .WithMany()
            .HasForeignKey(g => g.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Game>()
            .HasOne(g => g.Opponent)
            .WithMany()
            .HasForeignKey(g => g.OpponentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}