class Config:
    # 10 MB cap on the JSON body, mostly for base64 logos.
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    JSON_SORT_KEYS = False
