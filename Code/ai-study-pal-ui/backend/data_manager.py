import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
INPUTS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'user_inputs.csv')

def load_data():
    """Loads dataset from CSV."""
    if not os.path.exists(DATA_FILE):
        return pd.DataFrame(columns=['text', 'subject'])
    return pd.read_csv(DATA_FILE)

def clean_data(df):
    """Cleans text data: removes duplicates and converts to lowercase."""
    df = df.drop_duplicates()
    df['text'] = df['text'].str.lower()
    return df

def get_subject_distribution():
    """Returns subject counts and a base64 encoded pie chart."""
    df = load_data()
    df = clean_data(df)
    
    if df.empty:
        return {}, None

    counts = df['subject'].value_counts()
    
    # Generate Pie Chart
    plt.figure(figsize=(6, 6))
    plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=140)
    plt.title('Subject Distribution')
    
    img_io = io.BytesIO()
    plt.savefig(img_io, format='png')
    img_io.seek(0)
    chart_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
    plt.close()
    
    return counts.to_dict(), chart_base64

def store_user_input(subject, hours, text):
    """Stores user input to a CSV file."""
    new_data = pd.DataFrame({'subject': [subject], 'hours': [hours], 'text': [text]})
    
    if not os.path.exists(INPUTS_FILE):
        new_data.to_csv(INPUTS_FILE, index=False)
    else:
        new_data.to_csv(INPUTS_FILE, mode='a', header=False, index=False)
    
    return True
