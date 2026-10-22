// Lab diagnostics: with ?gldebug in the URL, records every WebGL failure (context refused, shader compile log,
// program link log) so it can be read on the page in any browser. Installed at module load, before any
// background's effect creates its context. Does nothing without the query parameter.

export type GlEvent = { kind: string; detail: string };

const log: GlEvent[] = [];
const listeners = new Set<() => void>();
const push = (kind: string, detail: string) => {
	log.push({ kind, detail: detail.slice(0, 600) });
	listeners.forEach((l) => l());
};

export const glEvents = () => log;
export function subscribeGl(l: () => void) {
	listeners.add(l);
	return () => listeners.delete(l);
}

export const glDebugOn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('gldebug');

if (glDebugOn) {
	const getContext = HTMLCanvasElement.prototype.getContext;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(HTMLCanvasElement.prototype as any).getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ctx = (getContext as any).call(this, type, ...rest);
		if (/webgl/.test(type)) {
			if (!ctx) push('context', `${type} refused`);
			else {
				const gl = ctx as WebGL2RenderingContext;
				push('context', `${type} ok · ${gl.getParameter(gl.VERSION)} · fragment uniforms ${gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)} · varyings ${gl.getParameter(gl.MAX_VARYING_VECTORS)} · viewport ${gl.getParameter(gl.MAX_VIEWPORT_DIMS)}`);
			}
		}
		return ctx;
	};
	for (const Proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
		const getShaderParameter = Proto.getShaderParameter;
		Proto.getShaderParameter = function (this: WebGL2RenderingContext, shader: WebGLShader, pname: number) {
			const value = getShaderParameter.call(this, shader, pname);
			if (pname === this.COMPILE_STATUS && !value) push('shader', this.getShaderInfoLog(shader) ?? 'compile failed');
			return value;
		};
		const getProgramParameter = Proto.getProgramParameter;
		Proto.getProgramParameter = function (this: WebGL2RenderingContext, program: WebGLProgram, pname: number) {
			const value = getProgramParameter.call(this, program, pname);
			if (pname === this.LINK_STATUS && !value) push('program', this.getProgramInfoLog(program) ?? 'link failed');
			return value;
		};
	}
	window.addEventListener('error', (e) => push('error', String(e.message)));
}
