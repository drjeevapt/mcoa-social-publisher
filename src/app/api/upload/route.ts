import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check size limit: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit' }, { status: 400 });
    }

    // Check mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format: ${file.type}. Allowed formats: JPG, PNG, WebP, GIF` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `mcoa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage bucket 'social-media-assets'
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('social-media-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    let publicUrl = '';

    if (uploadErr) {
      // If bucket does not exist or storage not configured yet, generate base64 data URL for preview/demo
      // while reporting the storage note
      console.warn('[Storage Warning]:', uploadErr.message);
      const base64Data = buffer.toString('base64');
      publicUrl = `data:${file.type};base64,${base64Data}`;
    } else {
      const { data: urlData } = supabase.storage
        .from('social-media-assets')
        .getPublicUrl(uploadData.path);
      publicUrl = urlData.publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (err: any) {
    console.error('[Upload Error]:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}
