import tkinter as tk
from multiprocessing.queues import Queue

from fs.glob import get_resource_path


def draw_rounded_rect(canvas: tk.Canvas, x1, y1, x2, y2, r, **kwargs):
    points = [
        x1 + r, y1,
        x2 - r, y1,
        x2, y1,
        x2, y1 + r,
        x2, y2 - r,
        x2, y2,
        x2 - r, y2,
        x1 + r, y2,
        x1, y2,
        x1, y2 - r,
        x1, y1 + r,
        x1, y1
    ]
    return canvas.create_polygon(points, smooth=True, **kwargs)


def run_show_splash(status_queue: Queue):
    # Initialize splash screen window
    splash = tk.Tk()
    splash.overrideredirect(True)  # Remove title bar and borders

    # Center the splash screen on the display
    width, height = 600, 400
    screen_width = splash.winfo_screenwidth()
    screen_height = splash.winfo_screenheight()
    x = (screen_width // 2) - (width // 2)
    y = (screen_height // 2) - (height // 2)
    splash.geometry(f"{width}x{height}+{x}+{y}")

    img_path = get_resource_path("src/assets/logo.png")
    img = tk.PhotoImage(file=img_path)
    transparent_key = "#050505"
    round_bg = "#111111"
    text_fg = "#dad8d8"

    canvas = tk.Canvas(
        splash,
        width=width,
        height=height,
        bg=transparent_key,
        highlightthickness=0
    )
    canvas.pack(fill="both", expand=True)

    draw_rounded_rect(canvas, 0+20, 0+20, width-20,
                      height-20, 25, fill=round_bg)

    close_btn = tk.Button(
        splash,
        text="✕",
        command=splash.destroy,
        bg=transparent_key,
        fg=text_fg,
        activebackground="#e81123",
        activeforeground="#ffffff",
        bd=0,
        font=("Arial", 11, "bold"),
        cursor="hand2"
    )
    close_btn.place(x=width - 35, y=20, width=20, height=20)

    tk.Label(
        splash,
        image=img,
        bg=round_bg,
        bd=0,
        highlightthickness=0,
        compound="top",
        text="Starting Hunterlog...",
        font=("Arial", 16, "bold"),
        fg=text_fg,
    ).place(relx=0.5, rely=0.5, anchor="center")

    # Poll the multiprocessing queue to check if pywebview is ready
    def check_ready():
        if not status_queue.empty():
            # anything pushed to this queue will kill splash screen
            splash.destroy()
        else:
            splash.after(100, check_ready)

    splash.after(100, check_ready)
    splash.mainloop()
