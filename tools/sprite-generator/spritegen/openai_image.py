import base64
import os
from pathlib import Path


def generate_master(reference: Path, prompt: str, output: Path) -> Path:
    """One paid image-edit call; everything after this function is local."""
    from openai import OpenAI

    client = OpenAI()
    model = os.environ.get("SPRITE_IMAGE_MODEL", "gpt-image-2")
    with reference.open("rb") as image:
        result = client.images.edit(
            model=model,
            image=image,
            prompt=prompt,
            size="1024x1024",
            quality="medium",
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(base64.b64decode(result.data[0].b64_json))
    return output
