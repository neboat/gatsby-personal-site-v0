import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import CilkBookHighlight from "../../components/my-syntax-highlighting"

const CilkHighlightPage = () => {
    const [formData, setFormData] = React.useState({
        inputCode: "int x;",
        inputCodeLang: "cilkcpp",
        inputCodeStyle: "cilkbook"
    })

    const handleInput = (e) => {
        const fieldName = e.target.name
        const fieldValue = e.target.value
        setFormData((prevState) => ({
            ...prevState,
            [fieldName]: fieldValue
        }))
    }
    
    const copyFormattedToClipboard = (event) => {
        const str = document.getElementById('outputCode').innerHTML
        function listener(e) {
            e.clipboardData.setData("text/html", str)
            e.clipboardData.setData("test/plain", str)
            e.preventDefault()
        }
        document.addEventListener("copy", listener)
        document.execCommand("copy")
        document.removeEventListener("copy", listener)
    }

    React.useEffect(() => {
        const code = formData.inputCode
        const lang = formData.inputCodeLang
        const style = formData.inputCodeStyle
        const div = document.getElementById("outputCode")
        div.innerHTML = CilkBookHighlight(code, lang, style)
    })

    return (
        <Layout>
            <div className="w-full max-w-xl">
                <form className="block pb-4">
                    <div>
                        <label htmlFor="inputCode" className="block mb-2 text-md text-gray-900">Enter code to highlight here:</label>
                        <textarea className="font-mono block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" name="inputCode" id="inputCode" rows="8" onChange={handleInput} value={formData.inputCode}></textarea>
                    </div>
                    <div className="grid grid-flow-col">
                        <div className="py-1">
                            <label htmlFor="inputCodeLang" className="mb-2 py-2 pr-2 text-md text-gray-900">Language:</label>
                            <select className="p-1 text-md text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" name="inputCodeLang" id="inputCodeLang" onChange={handleInput} value={formData.inputCodeLang}>
                                <option value="cilkcpp">Cilk/C++</option>
                                <option value="cilkc">Cilk/C</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                        </div>
                        <div className="py-1">
                            <label htmlFor="inputCodeStyle" className="mb-2 py-2 pr-2 text-md text-gray-900">Style:</label>
                            <select className="p-1 text-md text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" name="inputCodeStyle" id="inputCodeStyle" onChange={handleInput} value={formData.inputCodeStyle}>
                                <option value="cilkbook">Cilkbook</option>
                                <option value="slack-dark">Slack (dark)</option>
                                <option value="slack-ochin">Slack (light)</option>
                            </select>
                        </div>
                    </div>
                </form>
                <button className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 border border-blue-700 rounded" onClick={copyFormattedToClipboard}>
                    Copy formatted text
                </button>
                <div id="outputCode" className="block border mb-2 rounded-lg"></div>
            </div>
        </Layout>
    )
}

export const Head = () => <Seo title="Cilk Highlight" />

export default CilkHighlightPage