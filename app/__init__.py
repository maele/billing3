from flask import Flask

from .blueprints.api import bp as api_bp
from .blueprints.pages import bp as pages_bp
from .config import Config
from .filters import register_filters


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    register_filters(app)

    return app
