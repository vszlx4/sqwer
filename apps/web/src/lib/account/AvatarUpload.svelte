<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmForm from '#lib/ui/ConfirmForm.svelte';
	import Avatar from './Avatar.svelte';

	interface Props {
		name: string;
		color: string;
		src: string | null;
		error?: string | null;
	}

	let { name, color, src, error = null }: Props = $props();

	const SIZE = 256;
	let prepared = $state<Blob | null>(null);
	let preview = $state<string | null>(null);
	let localError = $state<string | null>(null);
	let busy = $state(false);
	let confirmed = $state(false);
	let input: HTMLInputElement | undefined = $state();

	/** Crops to a centred square, resizes and re-encodes, which also removes metadata such as location. */
	async function prepare(file: File) {
		localError = null;
		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			localError = 'Select a PNG, JPEG or WebP image.';
			return;
		}
		if (file.size > 15 * 1024 * 1024) {
			localError = 'Select an image of 15 MB or smaller.';
			return;
		}
		try {
			const bitmap = await createImageBitmap(file);
			const side = Math.min(bitmap.width, bitmap.height);
			const canvas = document.createElement('canvas');
			canvas.width = SIZE;
			canvas.height = SIZE;
			canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.88));
			if (!blob) throw new Error('encode');
			prepared = blob;
			if (preview) URL.revokeObjectURL(preview);
			preview = URL.createObjectURL(blob);
		} catch {
			localError = 'The image could not be read. Please try another file.';
		}
	}
</script>

<section class="upload" aria-labelledby="pfp-title">
	<h2 id="pfp-title" class="sr-only">Profile picture</h2>
	<div class="row">
		<Avatar {name} {color} size={88} src={preview ?? src} />
		<div class="controls">
			<form
				method="POST"
				action="?/avatar"
				enctype="multipart/form-data"
				novalidate
				use:enhance={({ formData, cancel }) => {
					if (!prepared) return cancel();
					if (!confirmed) {
						localError = 'Confirm that you hold the rights to this image before uploading it.';
						return cancel();
					}
					localError = null;
					formData.set('avatar', prepared, 'avatar.webp');
					busy = true;
					return async ({ update }) => {
						await update();
						busy = false;
						prepared = null;
						preview = null;
						confirmed = false;
						if (input) input.value = '';
					};
				}}
			>
				<label class="btn" for="pfp-input">Choose an image</label>
				<input
					bind:this={input}
					id="pfp-input"
					class="sr-only"
					type="file"
					name="avatar"
					accept="image/png,image/jpeg,image/webp"
					onchange={(e) => {
						const f = (e.currentTarget as HTMLInputElement).files?.[0];
						if (f) prepare(f);
					}}
				/>
				{#if prepared}
					<button class="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Save picture'}</button>
					<label class="check rights">
						<input type="checkbox" name="rightsConfirm" bind:checked={confirmed} required aria-invalid={localError && !confirmed ? 'true' : undefined} />
						<span>
							I took or created this image, or have permission to use it, and it does not infringe anyone’s rights, as set
							out in the <a href="/copyright" target="_blank">Content and Copyright Policy</a>.<span class="req" aria-hidden="true"></span>
						</span>
					</label>
				{/if}
			</form>
			{#if src && !prepared}
				<ConfirmForm action="?/removeAvatar" title="Remove your profile picture?" confirmLabel="Remove picture" pendingLabel="Removing…" danger>
					{#snippet trigger()}Remove picture{/snippet}
					{#snippet message()}
						<p>Your initials will be shown instead. You can upload a new picture at any time.</p>
					{/snippet}
				</ConfirmForm>
			{/if}
		</div>
	</div>
	<p class="hint">
		PNG, JPEG or WebP. The image is cropped to a square and resized before upload, and location and camera data are
		removed. Upload only images you have the right to use; do not upload photographs of other people without their
		consent.
	</p>
	{#if localError || error}<p class="error" role="alert">{localError ?? error}</p>{/if}
</section>

<style>
	.upload {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
	}
	.controls,
	.controls form {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	label.btn {
		cursor: pointer;
	}
	.rights {
		flex-basis: 100%;
		max-width: 520px;
		font-size: 13.5px;
	}
	label.btn:has(+ input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.hint {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
</style>
