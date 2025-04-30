import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default function AuthCodeError() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="mx-auto max-w-md text-center">
                <h1 className="text-4xl font-bold mb-4">Authentication Error</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    There was an error processing your authentication request. Please try again.
                </p>
                <Button asChild>
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        </div>
    )
}
