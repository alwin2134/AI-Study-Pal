"""Utility to synthesize QA pairs from documents using the local LLM.

If `local_llm` (in `ml_utils`) is available, this script will iterate over
uploaded documents (via `metadata_manager`), extract text, and prompt the LLM
to produce a small set of Q/A pairs per document. Results are saved to
`data/qa_synth.json` for evaluation.
"""
import os
import json
from typing import List

import metadata_manager
import file_processor


def synthesize_from_uploads(output_path: str = 'data/qa_synth.json', per_doc: int = 5):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    upload_dir = os.path.join(BASE_DIR, 'data', 'uploads')
    meta = metadata_manager.load_metadata()

    try:
        from llm_providers import get_provider
        local_llm = get_provider('local')
    except Exception:
        local_llm = None

    dataset = []
    for fname, info in meta.items():
        fpath = os.path.join(upload_dir, fname)
        if not os.path.exists(fpath):
            continue
        text = file_processor.extract_text_from_file(fpath)
        if not text or text.startswith('Error'):
            continue

        if local_llm and local_llm.generator:
            prompt = (
                "You are an assistant that generates educational QA pairs.\n"
                f"Document title: {info.get('original_name', fname)}\n"
                "Produce JSON array of objects with fields 'question' and 'answer'.\n"
                f"Create {per_doc} concise question-answer pairs that are directly answerable from the document.\n\n"
                f"Document:\n{text[:3000]}\n\n"
            )
            out = local_llm.generate(prompt, max_new_tokens=400)
            # Try to extract JSON from output
            try:
                # naive find first '{' or '['
                start = out.find('[')
                jsonpart = out[start:]
                pairs = json.loads(jsonpart)
                for p in pairs:
                    dataset.append({
                        'source': fname,
                        'question': p.get('question'),
                        'answer': p.get('answer')
                    })
            except Exception:
                # fallback: skip if parsing failed
                continue
        else:
            # Without a local LLM we cannot synthesize. Save a placeholder.
            dataset.append({'source': fname, 'note': 'LLM not available to synthesize'})

    # ensure data directory exists
    out_full = os.path.join(BASE_DIR, output_path)
    os.makedirs(os.path.dirname(out_full), exist_ok=True)
    with open(out_full, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2)

    return out_full


if __name__ == '__main__':
    path = synthesize_from_uploads()
    print('Wrote synthetic QA dataset to', path)
