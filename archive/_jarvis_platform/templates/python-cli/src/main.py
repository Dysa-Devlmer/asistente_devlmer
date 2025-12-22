#!/usr/bin/env python3
"""
CLI creada por JARVIS MARK VII
"""

import click

@click.group()
def cli():
    """CLI creada por JARVIS - Herramienta de línea de comandos"""
    pass

@cli.command()
@click.option('--name', prompt='Tu nombre', help='Nombre del usuario')
def hello(name):
    """Saluda al usuario"""
    click.echo(f'¡Hola, {name}! Bienvenido a JARVIS CLI 🤖')
    click.echo('Esta herramienta fue generada automáticamente.')

@cli.command()
def version():
    """Muestra la versión de la CLI"""
    click.echo('JARVIS CLI v1.0.0')
    click.echo('Creado por: JARVIS MARK VII')

@cli.command()
@click.argument('text')
def echo(text):
    """Repite el texto proporcionado"""
    click.echo(f'Eco: {text}')

if __name__ == '__main__':
    cli()
