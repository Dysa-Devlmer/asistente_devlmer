"""
Tests para la CLI de JARVIS
"""

from click.testing import CliRunner
from src.main import cli, hello, version

def test_version():
    """Test del comando version"""
    runner = CliRunner()
    result = runner.invoke(version)
    assert result.exit_code == 0
    assert 'v1.0.0' in result.output

def test_hello():
    """Test del comando hello"""
    runner = CliRunner()
    result = runner.invoke(hello, ['--name', 'Test'])
    assert result.exit_code == 0
    assert 'Hola' in result.output
