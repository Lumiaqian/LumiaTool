#pragma once

#include <stdint.h>

typedef struct {
    double duration;
    int32_t width;
    int32_t height;
} LumiaVideoInfo;

int lumia_probe_video(const char *path, LumiaVideoInfo *out, char *err, int err_len);

int lumia_export_mp4(
    const char *src,
    const char *dest,
    double start,
    double duration,
    int height,
    char *err,
    int err_len
);

int lumia_extract_jpeg(
    const char *src,
    const char *dest,
    double at_time,
    char *err,
    int err_len
);

int lumia_export_apple_live_photo(
    const char *src,
    const char *cover_jpeg,
    double start,
    double duration,
    double cover_time,
    const char *output_dir,
    const char *wallpaper_base_mov,
    int import_photos,
    int wallpaper_mode,
    char *heic_out,
    int heic_out_len,
    char *mov_out,
    int mov_out_len,
    char *err,
    int err_len
);
