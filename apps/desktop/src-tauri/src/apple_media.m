#import "apple_media.h"

#import <AVFoundation/AVFoundation.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>
#import <Photos/Photos.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#include <math.h>

static const char *kContentIdentifierKey = "com.apple.quicktime.content.identifier";
static const char *kStillImageTimeKey = "com.apple.quicktime.still-image-time";

static void set_error(char *err, int err_len, NSString *message) {
    if (err == NULL || err_len <= 0) {
        return;
    }
    NSData *data = [message dataUsingEncoding:NSUTF8StringEncoding];
    int copy = MIN((int)data.length, err_len - 1);
    memcpy(err, data.bytes, (size_t)copy);
    err[copy] = 0;
}

static AVURLAsset *load_asset(const char *path, char *err, int err_len) {
    if (path == NULL || path[0] == 0) {
        set_error(err, err_len, @"Missing video path");
        return nil;
    }
    NSURL *url = [NSURL fileURLWithPath:[NSString stringWithUTF8String:path]];
    if (url == nil) {
        set_error(err, err_len, @"Invalid video path");
        return nil;
    }
    return [AVURLAsset URLAssetWithURL:url options:@{
        AVURLAssetPreferPreciseDurationAndTimingKey: @YES
    }];
}

static BOOL export_composition(
    AVAsset *asset,
    CMTimeRange range,
    NSURL *outputURL,
    AVFileType fileType,
    NSArray<AVMetadataItem *> *metadata,
    NSString *preset,
    BOOL wallpaper,
    NSError **outError
) {
    NSFileManager *files = NSFileManager.defaultManager;
    if ([files fileExistsAtPath:outputURL.path]) {
        [files removeItemAtURL:outputURL error:nil];
    }

    AVMutableComposition *composition = [AVMutableComposition composition];
    NSError *error = nil;
    AVAssetTrack *videoTrack = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
    if (videoTrack == nil) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:1 userInfo:@{
                NSLocalizedDescriptionKey: @"Video has no video track"
            }];
        }
        return NO;
    }
    AVMutableCompositionTrack *compVideo = [composition addMutableTrackWithMediaType:AVMediaTypeVideo
                                                                    preferredTrackID:kCMPersistentTrackID_Invalid];
    if (![compVideo insertTimeRange:range ofTrack:videoTrack atTime:kCMTimeZero error:&error]) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }
    compVideo.preferredTransform = videoTrack.preferredTransform;

    AVAssetTrack *audioTrack = [asset tracksWithMediaType:AVMediaTypeAudio].firstObject;
    if (audioTrack != nil) {
        AVMutableCompositionTrack *compAudio = [composition addMutableTrackWithMediaType:AVMediaTypeAudio
                                                                        preferredTrackID:kCMPersistentTrackID_Invalid];
        [compAudio insertTimeRange:range ofTrack:audioTrack atTime:kCMTimeZero error:nil];
    }

    AVAssetExportSession *session = [[AVAssetExportSession alloc] initWithAsset:composition presetName:preset];
    if (session == nil) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:2 userInfo:@{
                NSLocalizedDescriptionKey: @"Failed to create export session"
            }];
        }
        return NO;
    }
    session.outputURL = outputURL;
    session.outputFileType = fileType;
    session.shouldOptimizeForNetworkUse = YES;
    session.metadata = metadata;

    if (wallpaper) {
        CGAffineTransform transform = videoTrack.preferredTransform;
        CGSize natural = videoTrack.naturalSize;
        CGRect rendered = CGRectApplyAffineTransform(CGRectMake(0, 0, natural.width, natural.height), transform);
        CGFloat width = round(fabs(rendered.size.width));
        CGFloat height = round(fabs(rendered.size.height));
        CGAffineTransform baked = transform;
        baked.tx -= rendered.origin.x;
        baked.ty -= rendered.origin.y;
        CGFloat longEdge = MAX(width, height);
        if (longEdge > 1920) {
            CGFloat scale = 1920 / longEdge;
            width = round(width * scale);
            height = round(height * scale);
            baked = CGAffineTransformConcat(baked, CGAffineTransformMakeScale(scale, scale));
        }
        width = floor(width / 2.0) * 2.0;
        height = floor(height / 2.0) * 2.0;
        if (width < 16) {
            width = 16;
        }
        if (height < 16) {
            height = 16;
        }
        AVMutableVideoComposition *videoComposition = [AVMutableVideoComposition videoComposition];
        videoComposition.renderSize = CGSizeMake(width, height);
        videoComposition.frameDuration = CMTimeMake(1, 30);
        videoComposition.renderScale = 1;
        videoComposition.colorPrimaries = AVVideoColorPrimaries_ITU_R_709_2;
        videoComposition.colorTransferFunction = AVVideoTransferFunction_ITU_R_709_2;
        videoComposition.colorYCbCrMatrix = AVVideoYCbCrMatrix_ITU_R_709_2;
        AVMutableVideoCompositionInstruction *instruction = [AVMutableVideoCompositionInstruction videoCompositionInstruction];
        instruction.timeRange = CMTimeRangeMake(kCMTimeZero, composition.duration);
        AVMutableVideoCompositionLayerInstruction *layer = [AVMutableVideoCompositionLayerInstruction videoCompositionLayerInstructionWithAssetTrack:compVideo];
        [layer setTransform:baked atTime:kCMTimeZero];
        instruction.layerInstructions = @[layer];
        videoComposition.instructions = @[instruction];
        session.videoComposition = videoComposition;
        compVideo.preferredTransform = CGAffineTransformIdentity;
    }

    dispatch_semaphore_t sem = dispatch_semaphore_create(0);
    [session exportAsynchronouslyWithCompletionHandler:^{
        dispatch_semaphore_signal(sem);
    }];
    if (dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 180ll * NSEC_PER_SEC)) != 0) {
        [session cancelExport];
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:13 userInfo:@{
                NSLocalizedDescriptionKey: @"Timed out encoding Live Photo video"
            }];
        }
        return NO;
    }

    if (session.status != AVAssetExportSessionStatusCompleted) {
        if (outError) {
            *outError = session.error ?: [NSError errorWithDomain:@"lumiatool" code:3 userInfo:@{
                NSLocalizedDescriptionKey: @"Video export failed"
            }];
        }
        return NO;
    }
    return YES;
}

static NSString *preset_for_height(int height) {
    if (height > 0 && height <= 720) {
        return AVAssetExportPreset1280x720;
    }
    if (height > 720 && height <= 1080) {
        return AVAssetExportPreset1920x1080;
    }
    return AVAssetExportPresetHighestQuality;
}

static BOOL write_jpeg(CGImageRef image, NSString *contentId, NSURL *url, NSError **outError) {
    CGImageDestinationRef dest = CGImageDestinationCreateWithURL(
        (__bridge CFURLRef)url,
        (__bridge CFStringRef)UTTypeJPEG.identifier,
        1,
        NULL
    );
    if (dest == NULL) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:4 userInfo:@{
                NSLocalizedDescriptionKey: @"Failed to create JPEG destination"
            }];
        }
        return NO;
    }
    NSDictionary *properties = nil;
    if (contentId.length > 0) {
        properties = @{
            (id)kCGImagePropertyMakerAppleDictionary: @{ @"17": contentId }
        };
    }
    CGImageDestinationAddImage(dest, image, (__bridge CFDictionaryRef)properties);
    BOOL ok = CGImageDestinationFinalize(dest);
    CFRelease(dest);
    if (!ok && outError) {
        *outError = [NSError errorWithDomain:@"lumiatool" code:5 userInfo:@{
            NSLocalizedDescriptionKey: @"Failed to write JPEG"
        }];
    }
    return ok;
}

static BOOL write_heic(CGImageRef image, NSString *contentId, NSURL *url, NSError **outError) {
    CGImageDestinationRef dest = CGImageDestinationCreateWithURL(
        (__bridge CFURLRef)url,
        (__bridge CFStringRef)UTTypeHEIC.identifier,
        1,
        NULL
    );
    if (dest == NULL) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:6 userInfo:@{
                NSLocalizedDescriptionKey: @"Failed to create HEIC destination"
            }];
        }
        return NO;
    }
    NSDictionary *properties = @{
        (id)kCGImagePropertyMakerAppleDictionary: @{ @"17": contentId }
    };
    CGImageDestinationAddImage(dest, image, (__bridge CFDictionaryRef)properties);
    BOOL ok = CGImageDestinationFinalize(dest);
    CFRelease(dest);
    if (!ok && outError) {
        *outError = [NSError errorWithDomain:@"lumiatool" code:7 userInfo:@{
            NSLocalizedDescriptionKey: @"Failed to write HEIC"
        }];
    }
    return ok;
}

static CGImageRef copy_frame(AVAsset *asset, CMTime time, NSError **outError) {
    AVAssetImageGenerator *generator = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
    generator.appliesPreferredTrackTransform = YES;
    generator.requestedTimeToleranceBefore = kCMTimeZero;
    generator.requestedTimeToleranceAfter = kCMTimeZero;
    CGImageRef image = [generator copyCGImageAtTime:time actualTime:NULL error:outError];
    return image;
}

static BOOL import_live_photo(NSURL *stillURL, NSURL *movURL, NSError **outError) {
    dispatch_semaphore_t authSem = dispatch_semaphore_create(0);
    __block PHAuthorizationStatus status = PHAuthorizationStatusNotDetermined;
    [PHPhotoLibrary requestAuthorizationForAccessLevel:PHAccessLevelReadWrite handler:^(PHAuthorizationStatus next) {
        status = next;
        dispatch_semaphore_signal(authSem);
    }];
    dispatch_semaphore_wait(authSem, DISPATCH_TIME_FOREVER);
    if (status != PHAuthorizationStatusAuthorized) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:8 userInfo:@{
                NSLocalizedDescriptionKey: @"Photos library access was denied"
            }];
        }
        return NO;
    }

    dispatch_semaphore_t changeSem = dispatch_semaphore_create(0);
    __block BOOL ok = NO;
    __block NSError *changeError = nil;
    [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
        PHAssetCreationRequest *request = [PHAssetCreationRequest creationRequestForAsset];
        PHAssetResourceCreationOptions *photoOpts = [PHAssetResourceCreationOptions new];
        photoOpts.originalFilename = stillURL.lastPathComponent;
        PHAssetResourceCreationOptions *videoOpts = [PHAssetResourceCreationOptions new];
        videoOpts.originalFilename = movURL.lastPathComponent;
        [request addResourceWithType:PHAssetResourceTypePhoto fileURL:stillURL options:photoOpts];
        [request addResourceWithType:PHAssetResourceTypePairedVideo fileURL:movURL options:videoOpts];
    } completionHandler:^(BOOL success, NSError *error) {
        ok = success;
        changeError = error;
        dispatch_semaphore_signal(changeSem);
    }];
    dispatch_semaphore_wait(changeSem, DISPATCH_TIME_FOREVER);
    if (!ok && outError) {
        *outError = changeError ?: [NSError errorWithDomain:@"lumiatool" code:9 userInfo:@{
            NSLocalizedDescriptionKey: @"Photos import failed"
        }];
    }
    return ok;
}

int lumia_probe_video(const char *path, LumiaVideoInfo *out, char *err, int err_len) {
    @autoreleasepool {
        AVURLAsset *asset = load_asset(path, err, err_len);
        if (asset == nil) {
            return 1;
        }
        AVAssetTrack *track = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
        CGSize size = track.naturalSize;
        CGAffineTransform transform = track.preferredTransform;
        CGSize rendered = CGSizeApplyAffineTransform(size, transform);
        if (out) {
            out->duration = CMTimeGetSeconds(asset.duration);
            out->width = (int32_t)fabs(rendered.width > 1 ? rendered.width : size.width);
            out->height = (int32_t)fabs(rendered.height > 1 ? rendered.height : size.height);
        }
        return 0;
    }
}

int lumia_export_mp4(
    const char *src,
    const char *dest,
    double start,
    double duration,
    int height,
    char *err,
    int err_len
) {
    @autoreleasepool {
        AVURLAsset *asset = load_asset(src, err, err_len);
        if (asset == nil) {
            return 1;
        }
        CMTimeRange range = CMTimeRangeMake(
            CMTimeMakeWithSeconds(MAX(start, 0), 600),
            CMTimeMakeWithSeconds(MAX(duration, 0.2), 600)
        );
        NSURL *output = [NSURL fileURLWithPath:[NSString stringWithUTF8String:dest]];
        NSError *error = nil;
        if (!export_composition(
            asset,
            range,
            output,
            AVFileTypeMPEG4,
            nil,
            preset_for_height(height),
            NO,
            &error
        )) {
            set_error(err, err_len, error.localizedDescription ?: @"MP4 export failed");
            return 1;
        }
        return 0;
    }
}

int lumia_extract_jpeg(
    const char *src,
    const char *dest,
    double at_time,
    char *err,
    int err_len
) {
    @autoreleasepool {
        AVURLAsset *asset = load_asset(src, err, err_len);
        if (asset == nil) {
            return 1;
        }
        NSError *error = nil;
        CGImageRef image = copy_frame(asset, CMTimeMakeWithSeconds(MAX(at_time, 0), 600), &error);
        if (image == NULL) {
            set_error(err, err_len, error.localizedDescription ?: @"Failed to extract frame");
            return 1;
        }
        NSURL *output = [NSURL fileURLWithPath:[NSString stringWithUTF8String:dest]];
        BOOL ok = write_jpeg(image, nil, output, &error);
        CGImageRelease(image);
        if (!ok) {
            set_error(err, err_len, error.localizedDescription ?: @"Failed to write JPEG");
            return 1;
        }
        return 0;
    }
}

static void start_copy_samples(AVAssetReaderOutput *readerOutput, AVAssetWriterInput *writerInput, dispatch_group_t group) {
    dispatch_group_enter(group);
    dispatch_queue_t queue = dispatch_queue_create("lumia.live.copy", DISPATCH_QUEUE_SERIAL);
    [writerInput requestMediaDataWhenReadyOnQueue:queue usingBlock:^{
        while (writerInput.readyForMoreMediaData) {
            CMSampleBufferRef sample = [readerOutput copyNextSampleBuffer];
            if (sample != NULL) {
                BOOL ok = [writerInput appendSampleBuffer:sample];
                CFRelease(sample);
                if (!ok) {
                    [writerInput markAsFinished];
                    dispatch_group_leave(group);
                    return;
                }
            } else {
                [writerInput markAsFinished];
                dispatch_group_leave(group);
                return;
            }
        }
    }];
}

static BOOL attach_live_metadata(NSURL *sourceURL, NSURL *outputURL, NSString *contentId, CMTime stillTime, NSError **outError) {
    NSFileManager *files = NSFileManager.defaultManager;
    if ([files fileExistsAtPath:outputURL.path]) {
        [files removeItemAtURL:outputURL error:nil];
    }
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:sourceURL options:@{
        AVURLAssetPreferPreciseDurationAndTimingKey: @YES
    }];
    AVAssetTrack *videoTrack = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
    if (videoTrack == nil) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:10 userInfo:@{
                NSLocalizedDescriptionKey: @"Remux source has no video track"
            }];
        }
        return NO;
    }

    NSError *error = nil;
    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:outputURL fileType:AVFileTypeQuickTimeMovie error:&error];
    if (writer == nil) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }

    CMFormatDescriptionRef videoHint = (__bridge CMFormatDescriptionRef)videoTrack.formatDescriptions.firstObject;
    AVAssetWriterInput *videoInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                                                        outputSettings:nil
                                                                      sourceFormatHint:videoHint];
    videoInput.expectsMediaDataInRealTime = NO;
    videoInput.transform = videoTrack.preferredTransform;
    if ([writer canAddInput:videoInput]) {
        [writer addInput:videoInput];
    }

    AVAssetTrack *audioTrack = [asset tracksWithMediaType:AVMediaTypeAudio].firstObject;
    AVAssetWriterInput *audioInput = nil;
    if (audioTrack != nil) {
        CMFormatDescriptionRef audioHint = (__bridge CMFormatDescriptionRef)audioTrack.formatDescriptions.firstObject;
        audioInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeAudio
                                                        outputSettings:nil
                                                      sourceFormatHint:audioHint];
        audioInput.expectsMediaDataInRealTime = NO;
        if ([writer canAddInput:audioInput]) {
            [writer addInput:audioInput];
        } else {
            audioInput = nil;
        }
    }

    NSArray *specs = @[
        @{
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier:
                [NSString stringWithFormat:@"mdta/%s", kContentIdentifierKey],
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType:
                (__bridge NSString *)kCMMetadataBaseDataType_UTF8
        },
        @{
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier:
                [NSString stringWithFormat:@"mdta/%s", kStillImageTimeKey],
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType:
                (__bridge NSString *)kCMMetadataBaseDataType_SInt8
        }
    ];
    CMFormatDescriptionRef metadataFormat = NULL;
    CMMetadataFormatDescriptionCreateWithMetadataSpecifications(
        kCFAllocatorDefault,
        kCMMetadataFormatType_Boxed,
        (__bridge CFArrayRef)specs,
        &metadataFormat
    );
    AVAssetWriterInput *metadataInput = nil;
    AVAssetWriterInputMetadataAdaptor *metadataAdaptor = nil;
    if (metadataFormat != NULL) {
        metadataInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeMetadata
                                                           outputSettings:nil
                                                         sourceFormatHint:metadataFormat];
        metadataInput.expectsMediaDataInRealTime = NO;
        if ([writer canAddInput:metadataInput]) {
            [writer addInput:metadataInput];
            metadataAdaptor = [AVAssetWriterInputMetadataAdaptor assetWriterInputMetadataAdaptorWithAssetWriterInput:metadataInput];
        }
        CFRelease(metadataFormat);
    }

    AVMutableMetadataItem *idItem = [AVMutableMetadataItem metadataItem];
    idItem.key = @(kContentIdentifierKey);
    idItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    idItem.value = contentId;
    idItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_UTF8;
    AVMutableMetadataItem *stillItem = [AVMutableMetadataItem metadataItem];
    stillItem.key = @(kStillImageTimeKey);
    stillItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    stillItem.value = @0;
    stillItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_SInt8;
    writer.metadata = @[idItem, stillItem];

    if (![writer startWriting]) {
        if (outError) {
            *outError = writer.error;
        }
        return NO;
    }
    [writer startSessionAtSourceTime:kCMTimeZero];

    if (metadataAdaptor != nil) {
        CMTime sampleDuration = CMTimeMake(1, MAX(stillTime.timescale, 600));
        AVTimedMetadataGroup *group = [[AVTimedMetadataGroup alloc] initWithItems:@[idItem, stillItem]
                                                                        timeRange:CMTimeRangeMake(stillTime, sampleDuration)];
        [metadataAdaptor appendTimedMetadataGroup:group];
        [metadataInput markAsFinished];
    }

    AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:asset error:&error];
    if (reader == nil) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }
    AVAssetReaderTrackOutput *videoOutput = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:videoTrack outputSettings:nil];
    if ([reader canAddOutput:videoOutput]) {
        [reader addOutput:videoOutput];
    }
    AVAssetReaderTrackOutput *audioOutput = nil;
    if (audioTrack != nil && audioInput != nil) {
        audioOutput = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:audioTrack outputSettings:nil];
        if ([reader canAddOutput:audioOutput]) {
            [reader addOutput:audioOutput];
        } else {
            audioOutput = nil;
        }
    }
    if (![reader startReading]) {
        if (outError) {
            *outError = reader.error;
        }
        return NO;
    }

    dispatch_group_t group = dispatch_group_create();
    start_copy_samples(videoOutput, videoInput, group);
    if (audioInput != nil && audioOutput != nil) {
        start_copy_samples(audioOutput, audioInput, group);
    }
    if (dispatch_group_wait(group, dispatch_time(DISPATCH_TIME_NOW, 120ll * NSEC_PER_SEC)) != 0) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:12 userInfo:@{
                NSLocalizedDescriptionKey: @"Timed out writing Live Photo video"
            }];
        }
        return NO;
    }

    dispatch_semaphore_t finish = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{
        dispatch_semaphore_signal(finish);
    }];
    dispatch_semaphore_wait(finish, dispatch_time(DISPATCH_TIME_NOW, 30ll * NSEC_PER_SEC));
    if (writer.status != AVAssetWriterStatusCompleted) {
        if (outError) {
            *outError = writer.error ?: [NSError errorWithDomain:@"lumiatool" code:11 userInfo:@{
                NSLocalizedDescriptionKey: @"Failed to write Live Photo metadata"
            }];
        }
        return NO;
    }
    return YES;
}

static BOOL write_wallpaper_mov(
    AVAsset *asset,
    CMTimeRange range,
    NSString *contentId,
    NSURL *outputURL,
    NSError **outError
) {
    NSFileManager *files = NSFileManager.defaultManager;
    if ([files fileExistsAtPath:outputURL.path]) {
        [files removeItemAtURL:outputURL error:nil];
    }

    NSError *error = nil;
    AVMutableComposition *composition = [AVMutableComposition composition];
    AVAssetTrack *videoTrack = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
    if (videoTrack == nil) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:1 userInfo:@{
                NSLocalizedDescriptionKey: @"Video has no video track"
            }];
        }
        return NO;
    }
    AVMutableCompositionTrack *compVideo = [composition addMutableTrackWithMediaType:AVMediaTypeVideo
                                                                    preferredTrackID:kCMPersistentTrackID_Invalid];
    if (![compVideo insertTimeRange:range ofTrack:videoTrack atTime:kCMTimeZero error:&error]) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }
    AVAssetTrack *audioTrack = [asset tracksWithMediaType:AVMediaTypeAudio].firstObject;
    AVMutableCompositionTrack *compAudio = nil;
    if (audioTrack != nil) {
        compAudio = [composition addMutableTrackWithMediaType:AVMediaTypeAudio
                                             preferredTrackID:kCMPersistentTrackID_Invalid];
        [compAudio insertTimeRange:range ofTrack:audioTrack atTime:kCMTimeZero error:nil];
    }

    CGAffineTransform transform = videoTrack.preferredTransform;
    CGSize natural = videoTrack.naturalSize;
    CGRect rendered = CGRectApplyAffineTransform(CGRectMake(0, 0, natural.width, natural.height), transform);
    CGFloat width = floor(fabs(rendered.size.width) / 2.0) * 2.0;
    CGFloat height = floor(fabs(rendered.size.height) / 2.0) * 2.0;
    CGAffineTransform baked = transform;
    baked.tx -= rendered.origin.x;
    baked.ty -= rendered.origin.y;
    CGFloat longEdge = MAX(width, height);
    if (longEdge > 1920) {
        CGFloat scale = 1920 / longEdge;
        width = floor(width * scale / 2.0) * 2.0;
        height = floor(height * scale / 2.0) * 2.0;
        baked = CGAffineTransformConcat(baked, CGAffineTransformMakeScale(scale, scale));
    }
    if (width < 16) {
        width = 16;
    }
    if (height < 16) {
        height = 16;
    }

    AVMutableVideoComposition *videoComposition = [AVMutableVideoComposition videoComposition];
    videoComposition.renderSize = CGSizeMake(width, height);
    videoComposition.frameDuration = CMTimeMake(1, 30);
    videoComposition.renderScale = 1;
    videoComposition.colorPrimaries = AVVideoColorPrimaries_ITU_R_709_2;
    videoComposition.colorTransferFunction = AVVideoTransferFunction_ITU_R_709_2;
    videoComposition.colorYCbCrMatrix = AVVideoYCbCrMatrix_ITU_R_709_2;
    AVMutableVideoCompositionInstruction *instruction = [AVMutableVideoCompositionInstruction videoCompositionInstruction];
    instruction.timeRange = CMTimeRangeMake(kCMTimeZero, composition.duration);
    AVMutableVideoCompositionLayerInstruction *layer = [AVMutableVideoCompositionLayerInstruction videoCompositionLayerInstructionWithAssetTrack:compVideo];
    [layer setTransform:baked atTime:kCMTimeZero];
    instruction.layerInstructions = @[layer];
    videoComposition.instructions = @[instruction];

    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:outputURL fileType:AVFileTypeQuickTimeMovie error:&error];
    if (writer == nil) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }

    NSDictionary *videoSettings = @{
        AVVideoCodecKey: AVVideoCodecTypeH264,
        AVVideoWidthKey: @(width),
        AVVideoHeightKey: @(height),
        AVVideoCompressionPropertiesKey: @{
            AVVideoAverageBitRateKey: @(width * height * 6),
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            AVVideoMaxKeyFrameIntervalKey: @30
        }
    };
    AVAssetWriterInput *videoInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:videoSettings];
    videoInput.expectsMediaDataInRealTime = NO;
    videoInput.transform = CGAffineTransformIdentity;
    if (![writer canAddInput:videoInput]) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:14 userInfo:@{
                NSLocalizedDescriptionKey: @"Cannot add H.264 video input"
            }];
        }
        return NO;
    }
    [writer addInput:videoInput];

    AVAssetWriterInput *audioInput = nil;
    if (compAudio != nil) {
        NSDictionary *audioSettings = @{
            AVFormatIDKey: @(kAudioFormatMPEG4AAC),
            AVNumberOfChannelsKey: @2,
            AVSampleRateKey: @44100,
            AVEncoderBitRateKey: @128000
        };
        audioInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeAudio outputSettings:audioSettings];
        audioInput.expectsMediaDataInRealTime = NO;
        if ([writer canAddInput:audioInput]) {
            [writer addInput:audioInput];
        } else {
            audioInput = nil;
        }
    }

    AVMutableMetadataItem *idItem = [AVMutableMetadataItem metadataItem];
    idItem.key = @(kContentIdentifierKey);
    idItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    idItem.value = contentId;
    idItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_UTF8;
    AVMutableMetadataItem *stillItem = [AVMutableMetadataItem metadataItem];
    stillItem.key = @(kStillImageTimeKey);
    stillItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    stillItem.value = @0;
    stillItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_SInt8;
    writer.metadata = @[idItem, stillItem];

    NSArray *specs = @[
        @{
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier:
                [NSString stringWithFormat:@"mdta/%s", kContentIdentifierKey],
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType:
                (__bridge NSString *)kCMMetadataBaseDataType_UTF8
        },
        @{
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier:
                [NSString stringWithFormat:@"mdta/%s", kStillImageTimeKey],
            (__bridge NSString *)kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType:
                (__bridge NSString *)kCMMetadataBaseDataType_SInt8
        }
    ];
    CMFormatDescriptionRef metadataFormat = NULL;
    CMMetadataFormatDescriptionCreateWithMetadataSpecifications(
        kCFAllocatorDefault,
        kCMMetadataFormatType_Boxed,
        (__bridge CFArrayRef)specs,
        &metadataFormat
    );
    AVAssetWriterInput *metadataInput = nil;
    AVAssetWriterInputMetadataAdaptor *metadataAdaptor = nil;
    if (metadataFormat != NULL) {
        metadataInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeMetadata
                                                           outputSettings:nil
                                                         sourceFormatHint:metadataFormat];
        metadataInput.expectsMediaDataInRealTime = NO;
        if ([writer canAddInput:metadataInput]) {
            [writer addInput:metadataInput];
            metadataAdaptor = [AVAssetWriterInputMetadataAdaptor assetWriterInputMetadataAdaptorWithAssetWriterInput:metadataInput];
        }
        CFRelease(metadataFormat);
    }

    AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:composition error:&error];
    if (reader == nil) {
        if (outError) {
            *outError = error;
        }
        return NO;
    }
    NSDictionary *readerVideoSettings = @{
        (id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA)
    };
    AVAssetReaderVideoCompositionOutput *videoOutput =
        [AVAssetReaderVideoCompositionOutput assetReaderVideoCompositionOutputWithVideoTracks:@[compVideo]
                                                                               videoSettings:readerVideoSettings];
    videoOutput.videoComposition = videoComposition;
    if ([reader canAddOutput:videoOutput]) {
        [reader addOutput:videoOutput];
    }
    AVAssetReaderTrackOutput *audioOutput = nil;
    if (compAudio != nil && audioInput != nil) {
        NSDictionary *readerAudioSettings = @{
            AVFormatIDKey: @(kAudioFormatLinearPCM),
            AVLinearPCMIsBigEndianKey: @NO,
            AVLinearPCMIsFloatKey: @NO,
            AVLinearPCMBitDepthKey: @16,
            AVLinearPCMIsNonInterleaved: @NO
        };
        audioOutput = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:compAudio outputSettings:readerAudioSettings];
        if ([reader canAddOutput:audioOutput]) {
            [reader addOutput:audioOutput];
        } else {
            audioOutput = nil;
            audioInput = nil;
        }
    }

    if (![writer startWriting] || ![reader startReading]) {
        if (outError) {
            *outError = writer.error ?: reader.error;
        }
        return NO;
    }
    [writer startSessionAtSourceTime:kCMTimeZero];

    if (metadataAdaptor != nil) {
        CMTime stillTime = CMTimeMultiplyByFloat64(composition.duration, 0.5);
        CMTime sampleDuration = CMTimeMake(1, 600);
        AVTimedMetadataGroup *timedGroup = [[AVTimedMetadataGroup alloc] initWithItems:@[idItem, stillItem]
                                                                            timeRange:CMTimeRangeMake(stillTime, sampleDuration)];
        [metadataAdaptor appendTimedMetadataGroup:timedGroup];
        [metadataInput markAsFinished];
    }

    dispatch_group_t copyGroup = dispatch_group_create();
    start_copy_samples(videoOutput, videoInput, copyGroup);
    if (audioInput != nil && audioOutput != nil) {
        start_copy_samples(audioOutput, audioInput, copyGroup);
    }
    if (dispatch_group_wait(copyGroup, dispatch_time(DISPATCH_TIME_NOW, 180ll * NSEC_PER_SEC)) != 0) {
        if (outError) {
            *outError = [NSError errorWithDomain:@"lumiatool" code:12 userInfo:@{
                NSLocalizedDescriptionKey: @"Timed out writing wallpaper Live Photo"
            }];
        }
        return NO;
    }

    dispatch_semaphore_t finish = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{
        dispatch_semaphore_signal(finish);
    }];
    dispatch_semaphore_wait(finish, dispatch_time(DISPATCH_TIME_NOW, 30ll * NSEC_PER_SEC));
    if (writer.status != AVAssetWriterStatusCompleted) {
        if (outError) {
            *outError = writer.error ?: [NSError errorWithDomain:@"lumiatool" code:11 userInfo:@{
                NSLocalizedDescriptionKey: @"Failed to write wallpaper Live Photo"
            }];
        }
        return NO;
    }
    return YES;
}

static BOOL export_live_mov(
    AVAsset *asset,
    CMTimeRange range,
    NSString *contentId,
    NSURL *outputURL,
    BOOL wallpaper,
    NSError **outError
) {
    if (wallpaper) {
        return write_wallpaper_mov(asset, range, contentId, outputURL, outError);
    }
    NSFileManager *files = NSFileManager.defaultManager;
    if ([files fileExistsAtPath:outputURL.path]) {
        [files removeItemAtURL:outputURL error:nil];
    }
    AVMutableMetadataItem *idItem = [AVMutableMetadataItem metadataItem];
    idItem.key = @(kContentIdentifierKey);
    idItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    idItem.value = contentId;
    idItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_UTF8;
    AVMutableMetadataItem *stillItem = [AVMutableMetadataItem metadataItem];
    stillItem.key = @(kStillImageTimeKey);
    stillItem.keySpace = AVMetadataKeySpaceQuickTimeMetadata;
    stillItem.value = @0;
    stillItem.dataType = (__bridge NSString *)kCMMetadataBaseDataType_SInt8;
    NSString *preset = AVAssetExportPresetHighestQuality;
    NSArray *presets = [AVAssetExportSession exportPresetsCompatibleWithAsset:asset];
    if ([presets containsObject:AVAssetExportPresetHEVCHighestQuality]) {
        preset = AVAssetExportPresetHEVCHighestQuality;
    }
    return export_composition(
        asset,
        range,
        outputURL,
        AVFileTypeQuickTimeMovie,
        @[idItem, stillItem],
        preset,
        NO,
        outError
    );
}

int lumia_export_apple_live_photo(
    const char *src,
    const char *cover_jpeg,
    double start,
    double duration,
    double cover_time,
    const char *output_dir,
    int import_photos,
    int wallpaper_mode,
    char *heic_out,
    int heic_out_len,
    char *mov_out,
    int mov_out_len,
    char *err,
    int err_len
) {
    if ([NSThread isMainThread]) {
        __block int result = 1;
        dispatch_semaphore_t sem = dispatch_semaphore_create(0);
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
            result = lumia_export_apple_live_photo(
                src,
                cover_jpeg,
                start,
                duration,
                cover_time,
                output_dir,
                import_photos,
                wallpaper_mode,
                heic_out,
                heic_out_len,
                mov_out,
                mov_out_len,
                err,
                err_len
            );
            dispatch_semaphore_signal(sem);
        });
        dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
        return result;
    }
    @autoreleasepool {
        AVURLAsset *asset = load_asset(src, err, err_len);
        if (asset == nil) {
            return 1;
        }
        NSString *folder = [NSString stringWithUTF8String:output_dir ?: ""];
        if (folder.length == 0) {
            set_error(err, err_len, @"Missing output directory");
            return 1;
        }
        NSString *stem = [[[NSString stringWithUTF8String:src] lastPathComponent] stringByDeletingPathExtension];
        if (stem.length == 0) {
            stem = @"LivePhoto";
        }
        if (wallpaper_mode) {
            stem = [stem stringByAppendingString:@"_Wallpaper"];
        }
        NSString *contentId = [NSUUID UUID].UUIDString;
        NSURL *stillURL = [NSURL fileURLWithPath:[folder stringByAppendingPathComponent:
            [NSString stringWithFormat:@"%@_Live.HEIC", stem]]];
        NSURL *movURL = [NSURL fileURLWithPath:[folder stringByAppendingPathComponent:
            [NSString stringWithFormat:@"%@_Live.MOV", stem]]];

        double assetDur = CMTimeGetSeconds(asset.duration);
        if (!isfinite(assetDur) || assetDur <= 0) {
            assetDur = MAX(duration, 0.2);
        }
        double dur = MAX(duration, 0.2);
        double st = MAX(start, 0);
        double cover = MIN(MAX(cover_time, 0), assetDur);
        if (wallpaper_mode) {
            dur = MIN(dur, 3.0);
            st = MAX(0, cover - dur / 2.0);
            if (st + dur > assetDur) {
                st = MAX(0, assetDur - dur);
            }
            dur = MIN(dur, MAX(assetDur - st, 0.2));
        }

        NSError *error = nil;
        CMTimeRange range = CMTimeRangeMake(
            CMTimeMakeWithSeconds(st, 600),
            CMTimeMakeWithSeconds(dur, 600)
        );
        if (!export_live_mov(asset, range, contentId, movURL, wallpaper_mode, &error)) {
            if (!export_composition(
                asset,
                range,
                movURL,
                AVFileTypeQuickTimeMovie,
                nil,
                AVAssetExportPresetHighestQuality,
                wallpaper_mode,
                &error
            )) {
                set_error(err, err_len, error.localizedDescription ?: @"MOV export failed");
                return 1;
            }
        }

        CGImageRef image = NULL;
        if (wallpaper_mode) {
            AVURLAsset *encoded = [AVURLAsset URLAssetWithURL:movURL options:@{
                AVURLAssetPreferPreciseDurationAndTimingKey: @YES
            }];
            image = copy_frame(encoded, CMTimeMultiplyByFloat64(encoded.duration, 0.5), &error);
        } else if (cover_jpeg && cover_jpeg[0] != 0) {
            NSURL *coverURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:cover_jpeg]];
            CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)coverURL, NULL);
            if (source) {
                image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
                CFRelease(source);
            }
        }
        if (image == NULL) {
            image = copy_frame(asset, CMTimeMakeWithSeconds(cover, 600), &error);
        }
        if (image == NULL) {
            set_error(err, err_len, error.localizedDescription ?: @"Failed to create cover image");
            return 1;
        }
        BOOL stillOk = write_heic(image, contentId, stillURL, &error);
        CGImageRelease(image);
        if (!stillOk) {
            set_error(err, err_len, error.localizedDescription ?: @"Failed to write still image");
            return 1;
        }

        if (heic_out && heic_out_len > 0) {
            set_error(heic_out, heic_out_len, stillURL.path);
        }
        if (mov_out && mov_out_len > 0) {
            set_error(mov_out, mov_out_len, movURL.path);
        }

        if (import_photos) {
            if (!import_live_photo(stillURL, movURL, &error)) {
                set_error(err, err_len, error.localizedDescription ?: @"Photos import failed");
                return 2;
            }
        }
        return 0;
    }
}
