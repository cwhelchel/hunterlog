
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
    # Slightly larger so the full-size logo + caption have room to breathe
    width, height = 540, 450
    screen_width = splash.winfo_screenwidth()
    screen_height = splash.winfo_screenheight()
    x = (screen_width // 2) - (width // 2)
    y = (screen_height // 2) - (height // 2)
    splash.geometry(f"{width}x{height}+{x}+{y}")

    img_path = get_resource_path("src/assets/logo.png")
    img = tk.PhotoImage(file=img_path)
    transparent_key = "#050505"
    round_bg = "#214228"
    shadow_bg = "#181818"
    accent = "#1f7a2e"  # matches the green in the logo
    text_fg = "#dad8d8"

    margin = 16
    radius = 32

    # windows only - crashes on linux b/c transparentcolor is not supported
    try:
        splash.wm_attributes("-transparentcolor", transparent_key)
    except tk.TclError:
        pass

    canvas = tk.Canvas(
        splash,
        width=width,
        height=height,
        bg=transparent_key,
        highlightthickness=0
    )
    canvas.pack(fill="both", expand=True)

    # Soft shadow/halo just outside the card
    draw_rounded_rect(canvas, margin - 8, margin - 8,
                      width - margin + 8, height - margin + 8,
                      radius + 8, fill=shadow_bg)

    # Main card with a thin green accent border
    draw_rounded_rect(canvas, margin, margin,
                      width - margin, height - margin,
                      radius, fill=round_bg, outline=accent, width=2)

    # Close button sits inside the card's top-right corner, inset from curve
    btn_size = 24
    btn_inset = 16
    close_btn = tk.Button(
        splash,
        text="✕",
        command=splash.destroy,
        bg=round_bg,
        fg=text_fg,
        activebackground="#e81123",
        activeforeground="#ffffff",
        bd=0,
        font=("Arial", 11, "bold"),
        cursor="hand2"
    )
    close_btn.place(x=width - margin - btn_inset - btn_size,
                    y=margin + btn_inset,
                    width=btn_size, height=btn_size)

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
        pady=8,
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
