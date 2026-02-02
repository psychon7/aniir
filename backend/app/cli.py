"""
CLI commands for the ERP application.
"""
import click
import sys


@click.group()
def cli():
    """ERP Application CLI."""
    pass


@cli.command()
def test_db():
    """Test database connection."""
    from app.tests.test_db_connection import run_all_tests
    success = run_all_tests()
    sys.exit(0 if success else 1)


@cli.command()
def show_config():
    """Show current configuration."""
    from app.core.config import settings
    
    click.echo("Current Configuration:")
    click.echo("-" * 40)
    click.echo(f"App Name: {settings.APP_NAME}")
    click.echo(f"Debug: {settings.DEBUG}")
    click.echo(f"DB Host: {settings.DB_HOST}")
    click.echo(f"DB Port: {settings.DB_PORT}")
    click.echo(f"DB Name: {settings.DB_NAME}")
    click.echo(f"DB User: {settings.DB_USER}")
    click.echo(f"DB Driver: {settings.DB_DRIVER}")


if __name__ == "__main__":
    cli()
