import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Getting started replaced the journey page; old links lead to it.
export const load: PageServerLoad = () => redirect(308, '/start');
