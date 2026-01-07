import Navbar from "@/components/layout/Navbar";
import CreateListingForm from "@/components/listings/CreateListingForm";

export default function SellPage() {
    return (
        <>
            <Navbar />
            <main style={{ padding: '2rem' }}>
                <CreateListingForm />
            </main>
        </>
    );
}
