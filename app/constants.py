DOC_TYPES = ('Quotation', 'Invoice')
DOC_TYPE_PREFIXES = {'Quotation': 'Q', 'Invoice': 'I'}

TEMPLATE_STYLES = (
    ('standard',   'Standard (Classic)'),
    ('modern',     'Modern (Bold & Sleek)'),
    ('minimalist', 'Minimalist (Clean & Elegant)'),
    ('creative',   'Creative (Vibrant & Airy)'),
    ('corporate',  'Corporate (Strict & Formal)'),
    ('eco',        'Eco Nature (Soft & Earthy)'),
    ('tech',       'Tech Dev (Data & Monospace)'),
)
ALLOWED_TEMPLATE_STYLES = {code for code, _ in TEMPLATE_STYLES}


def resolve_template_style(vendor: dict | None) -> str:
    if vendor and vendor.get('template_style') in ALLOWED_TEMPLATE_STYLES:
        return vendor['template_style']
    return 'standard'
