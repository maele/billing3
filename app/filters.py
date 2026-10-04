from decimal import Decimal, InvalidOperation

from flask import Flask


def money(value) -> str:
    if value is None or value == '':
        return '0.00'
    try:
        return f"{Decimal(str(value)):,.2f}"
    except (InvalidOperation, TypeError):
        return '0.00'


def register_filters(app: Flask) -> None:
    app.jinja_env.filters['money'] = money
